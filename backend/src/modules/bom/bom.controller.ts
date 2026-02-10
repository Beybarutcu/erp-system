import { Request, Response, NextFunction } from 'express';
import { prisma } from '@shared/database/client';
import { AppError } from '@shared/middleware/error-handler';
import { Decimal } from '@prisma/client/runtime/library';

// Get product BOM (one level)
export const getProductBOM = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const lang = req.user?.languagePreference || 'tr';

    const bomItems = await prisma.bomItem.findMany({
      where: {
        parentProductId: productId,
        isActive: true,
      },
      include: {
        childProduct: {
          include: {
            translations: {
              where: { languageCode: lang },
            },
          },
        },
        translations: {
          where: { languageCode: lang },
        },
      },
      orderBy: {
        sequenceOrder: 'asc',
      },
    });

    res.json({
      success: true,
      data: bomItems,
    });
  } catch (error) {
    next(error);
  }
};

// Get BOM tree (recursive - full hierarchy)
export const getBOMTree = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const lang = req.user?.languagePreference || 'tr';

    // Recursive CTE to get full BOM tree
    const tree = await prisma.$queryRaw`
      WITH RECURSIVE bom_tree AS (
        -- Base case: Root level
        SELECT 
          bi.id,
          bi.parent_product_id,
          bi.child_product_id,
          bi.sequence_order,
          bi.quantity,
          bi.operation_type,
          bi.machine_type,
          bi.cycle_time_seconds,
          bi.setup_time_minutes,
          bi.scrap_rate,
          bi.level,
          p.code as product_code,
          p.type as product_type,
          pt.name as product_name,
          ARRAY[bi.id] as path,
          bi.quantity as total_quantity
        FROM bom_items bi
        JOIN products p ON bi.child_product_id = p.id
        LEFT JOIN product_translations pt ON p.id = pt.product_id 
          AND pt.language_code = ${lang}
        WHERE bi.parent_product_id = ${productId}::uuid
          AND bi.is_active = true
        
        UNION ALL
        
        -- Recursive case: Children
        SELECT 
          bi.id,
          bi.parent_product_id,
          bi.child_product_id,
          bi.sequence_order,
          bi.quantity,
          bi.operation_type,
          bi.machine_type,
          bi.cycle_time_seconds,
          bi.setup_time_minutes,
          bi.scrap_rate,
          bi.level,
          p.code as product_code,
          p.type as product_type,
          pt.name as product_name,
          bt.path || bi.id,
          bt.total_quantity * bi.quantity as total_quantity
        FROM bom_items bi
        JOIN products p ON bi.child_product_id = p.id
        LEFT JOIN product_translations pt ON p.id = pt.product_id 
          AND pt.language_code = ${lang}
        INNER JOIN bom_tree bt ON bi.parent_product_id = bt.child_product_id
        WHERE NOT bi.id = ANY(bt.path) -- Prevent cycles
          AND bi.is_active = true
      )
      SELECT * FROM bom_tree
      ORDER BY level, sequence_order
    `;

    res.json({
      success: true,
      data: tree,
    });
  } catch (error) {
    next(error);
  }
};

// Explode BOM - Calculate all materials needed for a quantity
export const explodeBOM = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;
    const lang = req.user?.languagePreference || 'tr';

    if (!quantity || quantity <= 0) {
      throw new AppError('Quantity must be greater than 0', 400);
    }

    // Get exploded BOM with quantities
    const explosion = await prisma.$queryRaw`
      WITH RECURSIVE bom_explosion AS (
        -- Base case
        SELECT 
          bi.id,
          bi.child_product_id,
          bi.level,
          p.code,
          p.type,
          pt.name,
          bi.quantity * ${quantity}::decimal as required_quantity,
          bi.scrap_rate,
          (bi.quantity * ${quantity}::decimal * (1 + bi.scrap_rate / 100)) as quantity_with_scrap,
          bi.operation_type,
          bi.machine_type,
          bi.cycle_time_seconds,
          bi.setup_time_minutes,
          ARRAY[bi.id] as path
        FROM bom_items bi
        JOIN products p ON bi.child_product_id = p.id
        LEFT JOIN product_translations pt ON p.id = pt.product_id 
          AND pt.language_code = ${lang}
        WHERE bi.parent_product_id = ${productId}::uuid
          AND bi.is_active = true
        
        UNION ALL
        
        -- Recursive case
        SELECT 
          bi.id,
          bi.child_product_id,
          bi.level,
          p.code,
          p.type,
          pt.name,
          be.quantity_with_scrap * bi.quantity as required_quantity,
          bi.scrap_rate,
          (be.quantity_with_scrap * bi.quantity * (1 + bi.scrap_rate / 100)) as quantity_with_scrap,
          bi.operation_type,
          bi.machine_type,
          bi.cycle_time_seconds,
          bi.setup_time_minutes,
          be.path || bi.id
        FROM bom_items bi
        JOIN products p ON bi.child_product_id = p.id
        LEFT JOIN product_translations pt ON p.id = pt.product_id 
          AND pt.language_code = ${lang}
        INNER JOIN bom_explosion be ON bi.parent_product_id = be.child_product_id
        WHERE NOT bi.id = ANY(be.path)
          AND bi.is_active = true
      )
      SELECT 
        child_product_id,
        code,
        type,
        name,
        SUM(required_quantity) as total_required,
        SUM(quantity_with_scrap) as total_with_scrap,
        MAX(level) as max_level,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'operation_type', operation_type,
            'machine_type', machine_type,
            'cycle_time_seconds', cycle_time_seconds,
            'setup_time_minutes', setup_time_minutes
          )
        ) as operations
      FROM bom_explosion
      GROUP BY child_product_id, code, type, name
      ORDER BY max_level, code
    `;

    // Check inventory availability for each material
    const materialsWithInventory = await Promise.all(
      (explosion as any[]).map(async (item) => {
        const availableStock = await prisma.inventoryLot.aggregate({
          where: {
            productId: item.child_product_id,
            status: 'ACTIVE',
          },
          _sum: {
            currentQuantity: true,
          },
        });

        const available = availableStock._sum.currentQuantity || new Decimal(0);
        const shortage = new Decimal(item.total_with_scrap).minus(available);

        return {
          ...item,
          availableStock: available.toNumber(),
          shortage: shortage.greaterThan(0) ? shortage.toNumber() : 0,
          hasSufficientStock: shortage.lessThanOrEqualTo(0),
        };
      })
    );

    const hasShortages = materialsWithInventory.some(
      (item) => !item.hasSufficientStock
    );

    res.json({
      success: true,
      data: {
        materials: materialsWithInventory,
        summary: {
          totalMaterials: materialsWithInventory.length,
          hasShortages,
          shortageCount: materialsWithInventory.filter((m) => !m.hasSufficientStock).length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create BOM item
export const createBOMItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const {
      childProductId,
      sequenceOrder,
      quantity,
      operationType,
      machineType,
      cycleTimeSeconds,
      setupTimeMinutes,
      scrapRate,
      level,
      translations,
    } = req.body;

    // Validate parent product exists
    const parentProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!parentProduct) {
      throw new AppError('Parent product not found', 404);
    }

    // Validate child product exists
    const childProduct = await prisma.product.findUnique({
      where: { id: childProductId },
    });

    if (!childProduct) {
      throw new AppError('Child product not found', 404);
    }

    // Check for circular dependency
    const wouldCreateCycle = await checkCircularDependency(
      productId,
      childProductId
    );

    if (wouldCreateCycle) {
      throw new AppError('Cannot create circular BOM dependency', 400);
    }

    // Create BOM item
    const bomItem = await prisma.bomItem.create({
      data: {
        parentProductId: productId,
        childProductId,
        sequenceOrder,
        quantity,
        operationType,
        machineType,
        cycleTimeSeconds,
        setupTimeMinutes,
        scrapRate: scrapRate || 0,
        level: level || 0,
        translations: translations
          ? {
              create: translations,
            }
          : undefined,
      },
      include: {
        translations: true,
        childProduct: {
          include: {
            translations: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: bomItem,
    });
  } catch (error) {
    next(error);
  }
};

// Update BOM item
export const updateBOMItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { bomItemId } = req.params;
    const updateData = req.body;

    const bomItem = await prisma.bomItem.update({
      where: { id: bomItemId },
      data: updateData,
      include: {
        translations: true,
        childProduct: {
          include: {
            translations: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: bomItem,
    });
  } catch (error) {
    next(error);
  }
};

// Delete BOM item
export const deleteBOMItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { bomItemId } = req.params;

    // Soft delete
    await prisma.bomItem.update({
      where: { id: bomItemId },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'BOM item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Copy BOM from another product
export const copyBOM = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { sourceProductId } = req.body;

    if (!sourceProductId) {
      throw new AppError('Source product ID is required', 400);
    }

    // Get source BOM
    const sourceBOM = await prisma.bomItem.findMany({
      where: {
        parentProductId: sourceProductId,
        isActive: true,
      },
      include: {
        translations: true,
      },
    });

    if (sourceBOM.length === 0) {
      throw new AppError('Source product has no BOM', 404);
    }

    // Copy BOM items
    const copiedItems = await Promise.all(
      sourceBOM.map(async (item) => {
        const { id, createdAt, parentProductId, translations, ...itemData } = item;
        
        return prisma.bomItem.create({
          data: {
            ...itemData,
            parentProductId: productId,
            translations: {
              create: translations.map(({ id, bomItemId, ...t }) => t),
            },
          },
          include: {
            translations: true,
          },
        });
      })
    );

    res.json({
      success: true,
      data: copiedItems,
      message: `Copied ${copiedItems.length} BOM items`,
    });
  } catch (error) {
    next(error);
  }
};

// Generate work orders from BOM
export const generateWorkOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { quantity, orderId, startDate } = req.body;

    if (!quantity || quantity <= 0) {
      throw new AppError('Quantity must be greater than 0', 400);
    }

    // Get BOM tree
    const bomTree = await prisma.bomItem.findMany({
      where: {
        parentProductId: productId,
        isActive: true,
      },
      orderBy: {
        sequenceOrder: 'asc',
      },
    });

    if (bomTree.length === 0) {
      throw new AppError('Product has no BOM', 404);
    }

    // Generate work order number
    const woNumber = `WO-${Date.now()}`;

    // Create work orders for each BOM step
    const workOrders = await Promise.all(
      bomTree.map(async (bomItem, index) => {
        const plannedQty = new Decimal(quantity).times(bomItem.quantity);
        
        return prisma.workOrder.create({
          data: {
            woNumber: `${woNumber}-${index + 1}`,
            productId: bomItem.childProductId,
            bomItemId: bomItem.id,
            orderId,
            plannedQuantity: plannedQty.toNumber(),
            plannedStartDate: startDate ? new Date(startDate) : new Date(),
            priority: 5,
            status: 'PLANNED',
            createdBy: req.user!.id,
          },
          include: {
            product: {
              include: {
                translations: true,
              },
            },
          },
        });
      })
    );

    res.status(201).json({
      success: true,
      data: workOrders,
      message: `Generated ${workOrders.length} work orders`,
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Check for circular dependency
async function checkCircularDependency(
  parentId: string,
  childId: string
): Promise<boolean> {
  if (parentId === childId) {
    return true;
  }

  // Check if child has parent in its BOM (recursive)
  const result = await prisma.$queryRaw<any[]>`
    WITH RECURSIVE bom_check AS (
      SELECT child_product_id
      FROM bom_items
      WHERE parent_product_id = ${childId}::uuid
        AND is_active = true
      
      UNION
      
      SELECT bi.child_product_id
      FROM bom_items bi
      INNER JOIN bom_check bc ON bi.parent_product_id = bc.child_product_id
      WHERE bi.is_active = true
    )
    SELECT COUNT(*) as count
    FROM bom_check
    WHERE child_product_id = ${parentId}::uuid
  `;

  return result[0]?.count > 0;
}
