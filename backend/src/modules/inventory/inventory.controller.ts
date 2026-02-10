import { Request, Response, NextFunction } from 'express';
import { prisma } from '@shared/database/client';
import { AppError } from '@shared/middleware/error-handler';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

// Get lots with filtering
export const getLots = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      productId,
      status,
      locationCode,
      page = 1,
      limit = 50,
    } = req.query;

    const where: Prisma.InventoryLotWhereInput = {};

    if (productId) where.productId = productId as string;
    if (status) where.status = status as any;
    if (locationCode) where.locationCode = locationCode as string;

    const [lots, total] = await Promise.all([
      prisma.inventoryLot.findMany({
        where,
        include: {
          product: {
            include: {
              translations: {
                where: { languageCode: req.user?.languagePreference || 'tr' },
              },
            },
          },
        },
        orderBy: {
          receivedDate: 'desc',
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.inventoryLot.count({ where }),
    ]);

    res.json({
      success: true,
      data: lots,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get lot by ID
export const getLotById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { lotId } = req.params;

    const lot = await prisma.inventoryLot.findUnique({
      where: { id: lotId },
      include: {
        product: {
          include: {
            translations: true,
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!lot) {
      throw new AppError('Lot not found', 404);
    }

    res.json({
      success: true,
      data: lot,
    });
  } catch (error) {
    next(error);
  }
};

// Create new lot (inventory receipt)
export const createLot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      productId,
      quantity,
      locationCode,
      supplierId,
      workOrderId,
      unitCost,
      expiryDate,
    } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      throw new AppError('Product ID and valid quantity are required', 400);
    }

    // Generate lot number
    const lotNumber = await generateLotNumber(productId);

    // Create lot
    const lot = await prisma.inventoryLot.create({
      data: {
        lotNumber,
        productId,
        initialQuantity: quantity,
        currentQuantity: quantity,
        locationCode,
        supplierId,
        workOrderId,
        unitCost,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: 'ACTIVE',
      },
      include: {
        product: {
          include: {
            translations: true,
          },
        },
      },
    });

    // Create transaction record
    await prisma.inventoryTransaction.create({
      data: {
        lotId: lot.id,
        transactionType: 'IN',
        quantity,
        referenceType: workOrderId ? 'WORK_ORDER' : supplierId ? 'PURCHASE' : 'ADJUSTMENT',
        referenceId: workOrderId || supplierId,
        createdBy: req.user!.id,
        notes: `Initial receipt - Lot ${lotNumber}`,
      },
    });

    res.status(201).json({
      success: true,
      data: lot,
    });
  } catch (error) {
    next(error);
  }
};

// Update lot
export const updateLot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { lotId } = req.params;
    const { status, locationCode } = req.body;

    const lot = await prisma.inventoryLot.update({
      where: { id: lotId },
      data: {
        ...(status && { status }),
        ...(locationCode && { locationCode }),
      },
      include: {
        product: {
          include: {
            translations: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: lot,
    });
  } catch (error) {
    next(error);
  }
};

// Get available stock summary
export const getAvailableStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.query;
    const lang = req.user?.languagePreference || 'tr';

    const where: any = {
      status: 'ACTIVE',
    };

    if (productId) {
      where.productId = productId;
    }

    const stockSummary = await prisma.$queryRaw<any[]>`
      SELECT 
        il.product_id,
        p.code as product_code,
        p.type as product_type,
        pt.name as product_name,
        SUM(il.current_quantity) as total_quantity,
        COUNT(il.id) as lot_count,
        MIN(il.received_date) as oldest_lot_date,
        MAX(il.received_date) as newest_lot_date,
        AVG(il.unit_cost) as avg_cost
      FROM inventory_lots il
      JOIN products p ON il.product_id = p.id
      LEFT JOIN product_translations pt ON p.id = pt.product_id 
        AND pt.language_code = ${lang}
      WHERE il.status = 'ACTIVE'
        AND il.current_quantity > 0
        ${productId ? Prisma.sql`AND il.product_id = ${productId}::uuid` : Prisma.empty}
      GROUP BY il.product_id, p.code, p.type, pt.name
      ORDER BY p.code
    `;

    res.json({
      success: true,
      data: stockSummary,
    });
  } catch (error) {
    next(error);
  }
};

// Get aging stock (FIFO warning)
export const getAgingStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { daysThreshold = 90 } = req.query;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - Number(daysThreshold));

    const agingLots = await prisma.inventoryLot.findMany({
      where: {
        status: 'ACTIVE',
        currentQuantity: { gt: 0 },
        receivedDate: { lt: thresholdDate },
      },
      include: {
        product: {
          include: {
            translations: true,
          },
        },
      },
      orderBy: {
        receivedDate: 'asc',
      },
    });

    const summary = agingLots.map((lot) => {
      const ageInDays = Math.floor(
        (Date.now() - lot.receivedDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return {
        ...lot,
        ageInDays,
        riskLevel: ageInDays > 180 ? 'HIGH' : ageInDays > 120 ? 'MEDIUM' : 'LOW',
      };
    });

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// **CRITICAL FIFO ALGORITHM** - Allocate stock (reserve for work order)
export const allocateStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, quantity, workOrderId } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      throw new AppError('Product ID and valid quantity are required', 400);
    }

    // Get available lots in FIFO order
    const availableLots = await prisma.inventoryLot.findMany({
      where: {
        productId,
        status: 'ACTIVE',
        currentQuantity: { gt: 0 },
      },
      orderBy: [
        { receivedDate: 'asc' },
        { id: 'asc' },
      ],
    });

    // Calculate if we have enough stock
    const totalAvailable = availableLots.reduce(
      (sum, lot) => sum.plus(lot.currentQuantity),
      new Decimal(0)
    );

    if (totalAvailable.lessThan(quantity)) {
      throw new AppError(
        `Insufficient stock. Required: ${quantity}, Available: ${totalAvailable}`,
        400
      );
    }

    // Allocate from lots (FIFO)
    let remaining = new Decimal(quantity);
    const allocations: any[] = [];

    for (const lot of availableLots) {
      if (remaining.lessThanOrEqualTo(0)) break;

      const toAllocate = Decimal.min(lot.currentQuantity, remaining);

      allocations.push({
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        quantity: toAllocate.toNumber(),
        unitCost: lot.unitCost?.toNumber() || 0,
      });

      remaining = remaining.minus(toAllocate);
    }

    res.json({
      success: true,
      data: {
        productId,
        requestedQuantity: quantity,
        allocations,
        totalCost: allocations.reduce(
          (sum, a) => sum + a.quantity * a.unitCost,
          0
        ),
      },
      message: 'Stock allocated successfully (FIFO)',
    });
  } catch (error) {
    next(error);
  }
};

// **CRITICAL FIFO ALGORITHM** - Consume stock (actual usage)
export const consumeStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, quantity, workOrderId, notes, manualLotId } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      throw new AppError('Product ID and valid quantity are required', 400);
    }

    // If manual lot selection, require reason
    if (manualLotId && !notes) {
      throw new AppError('Reason is required for manual lot selection', 400);
    }

    let lotsToConsume: any[];

    if (manualLotId) {
      // Manual lot selection (bypass FIFO)
      const lot = await prisma.inventoryLot.findUnique({
        where: { id: manualLotId },
      });

      if (!lot || lot.productId !== productId) {
        throw new AppError('Invalid lot selected', 400);
      }

      if (lot.currentQuantity.lessThan(quantity)) {
        throw new AppError('Insufficient quantity in selected lot', 400);
      }

      lotsToConsume = [lot];
    } else {
      // FIFO automatic selection
      lotsToConsume = await prisma.inventoryLot.findMany({
        where: {
          productId,
          status: 'ACTIVE',
          currentQuantity: { gt: 0 },
        },
        orderBy: [
          { receivedDate: 'asc' },
          { id: 'asc' },
        ],
      });
    }

    // Check total availability
    const totalAvailable = lotsToConsume.reduce(
      (sum, lot) => sum.plus(lot.currentQuantity),
      new Decimal(0)
    );

    if (totalAvailable.lessThan(quantity)) {
      throw new AppError(
        `Insufficient stock. Required: ${quantity}, Available: ${totalAvailable}`,
        400
      );
    }

    // Consume from lots (FIFO)
    let remaining = new Decimal(quantity);
    const consumed: any[] = [];

    // Start transaction
    await prisma.$transaction(async (tx) => {
      for (const lot of lotsToConsume) {
        if (remaining.lessThanOrEqualTo(0)) break;

        const toConsume = Decimal.min(lot.currentQuantity, remaining);

        // Update lot quantity
        await tx.inventoryLot.update({
          where: { id: lot.id },
          data: {
            currentQuantity: lot.currentQuantity.minus(toConsume),
          },
        });

        // Create transaction record
        await tx.inventoryTransaction.create({
          data: {
            lotId: lot.id,
            transactionType: 'OUT',
            quantity: toConsume.toNumber(),
            referenceType: 'WORK_ORDER',
            referenceId: workOrderId,
            createdBy: req.user!.id,
            notes: manualLotId
              ? `Manual lot selection: ${notes}`
              : 'FIFO consumption',
          },
        });

        consumed.push({
          lotId: lot.id,
          lotNumber: lot.lotNumber,
          quantity: toConsume.toNumber(),
          unitCost: lot.unitCost?.toNumber() || 0,
          fifoOrder: !manualLotId,
        });

        remaining = remaining.minus(toConsume);
      }
    });

    res.json({
      success: true,
      data: {
        productId,
        consumedQuantity: quantity,
        consumed,
        totalCost: consumed.reduce((sum, c) => sum + c.quantity * c.unitCost, 0),
        method: manualLotId ? 'MANUAL' : 'FIFO',
      },
      message: 'Stock consumed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Adjust stock (corrections)
export const adjustStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { lotId, newQuantity, reason } = req.body;

    if (!lotId || newQuantity === undefined || !reason) {
      throw new AppError('Lot ID, new quantity, and reason are required', 400);
    }

    const lot = await prisma.inventoryLot.findUnique({
      where: { id: lotId },
    });

    if (!lot) {
      throw new AppError('Lot not found', 404);
    }

    const difference = new Decimal(newQuantity).minus(lot.currentQuantity);

    // Update lot
    await prisma.$transaction([
      prisma.inventoryLot.update({
        where: { id: lotId },
        data: { currentQuantity: newQuantity },
      }),
      prisma.inventoryTransaction.create({
        data: {
          lotId,
          transactionType: 'ADJUST',
          quantity: Math.abs(difference.toNumber()),
          referenceType: 'ADJUSTMENT',
          createdBy: req.user!.id,
          notes: `Adjustment: ${reason}. Change: ${difference.toNumber()}`,
        },
      }),
    ]);

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: {
        lotId,
        oldQuantity: lot.currentQuantity.toNumber(),
        newQuantity,
        difference: difference.toNumber(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get transactions
export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { lotId, productId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const where: any = {};

    if (lotId) where.lotId = lotId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        include: {
          lot: {
            include: {
              product: {
                include: {
                  translations: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.inventoryTransaction.count({ where }),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Inventory valuation
export const getInventoryValuation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const valuation = await prisma.$queryRaw<any[]>`
      SELECT 
        p.code,
        p.type,
        pt.name,
        SUM(il.current_quantity) as total_quantity,
        AVG(il.unit_cost) as avg_unit_cost,
        SUM(il.current_quantity * il.unit_cost) as total_value
      FROM inventory_lots il
      JOIN products p ON il.product_id = p.id
      LEFT JOIN product_translations pt ON p.id = pt.product_id 
        AND pt.language_code = ${req.user?.languagePreference || 'tr'}
      WHERE il.status = 'ACTIVE'
        AND il.current_quantity > 0
      GROUP BY p.id, p.code, p.type, pt.name
      ORDER BY total_value DESC
    `;

    const summary = {
      totalValue: valuation.reduce((sum, item) => sum + Number(item.total_value || 0), 0),
      totalItems: valuation.length,
    };

    res.json({
      success: true,
      data: {
        items: valuation,
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Inventory movement report
export const getInventoryMovement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const movements = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE(it.created_at) as date,
        it.transaction_type,
        COUNT(*) as transaction_count,
        SUM(it.quantity) as total_quantity
      FROM inventory_transactions it
      JOIN inventory_lots il ON it.lot_id = il.id
      WHERE 1=1
        ${productId ? Prisma.sql`AND il.product_id = ${productId}::uuid` : Prisma.empty}
        ${startDate ? Prisma.sql`AND it.created_at >= ${new Date(startDate as string)}` : Prisma.empty}
        ${endDate ? Prisma.sql`AND it.created_at <= ${new Date(endDate as string)}` : Prisma.empty}
      GROUP BY DATE(it.created_at), it.transaction_type
      ORDER BY date DESC, transaction_type
    `;

    res.json({
      success: true,
      data: movements,
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Generate lot number
async function generateLotNumber(productId: string): Promise<string> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { code: true },
  });

  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  
  const count = await prisma.inventoryLot.count({
    where: {
      productId,
      receivedDate: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
      },
    },
  });

  return `${product?.code || 'LOT'}-${dateStr}-${String(count + 1).padStart(3, '0')}`;
}
