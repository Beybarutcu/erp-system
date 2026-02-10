import { prisma } from '@shared/database/client';
import { Prisma } from '@prisma/client';
import { AppError } from '@shared/middleware/error-handler';
import { cache } from '@shared/database/redis';
import { 
  PaginationParams, 
  PaginatedResponse,
  Translation 
} from '@shared/types';
import { 
  createPaginatedResponse,
  parsePaginationParams 
} from '@shared/utils/helpers';

export class ProductsService {
  /**
   * Get all products with pagination and filters
   */
  async getProducts(
    params: PaginationParams & {
      type?: string;
      isStocked?: boolean;
      search?: string;
    },
    languageCode: string = 'tr'
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc', type, isStocked, search } = params;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (type) {
      where.type = type as any;
    }

    if (isStocked !== undefined) {
      where.isStocked = isStocked;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        {
          translations: {
            some: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    // Execute queries
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          translations: {
            where: { languageCode },
          },
          _count: {
            select: {
              bomParent: true,
              inventoryLots: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return createPaginatedResponse(products, total, params);
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string, languageCode: string = 'tr') {
    const cacheKey = `product:${id}:${languageCode}`;
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        translations: {
          where: { languageCode },
        },
        bomParent: {
          where: { isActive: true },
          include: {
            childProduct: {
              include: {
                translations: {
                  where: { languageCode },
                },
              },
            },
          },
        },
        _count: {
          select: {
            bomParent: true,
            bomChild: true,
            inventoryLots: true,
            workOrders: true,
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Cache for 5 minutes
    await cache.set(cacheKey, product, 300);

    return product;
  }

  /**
   * Create new product
   */
  async createProduct(data: {
    code: string;
    type: string;
    isStocked?: boolean;
    translations: Translation[];
  }, userId: string) {
    // Check if code already exists
    const existing = await prisma.product.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new AppError('Product code already exists', 400);
    }

    // Create product with translations
    const product = await prisma.product.create({
      data: {
        code: data.code,
        type: data.type as any,
        isStocked: data.isStocked ?? true,
        createdBy: userId,
        translations: {
          create: data.translations,
        },
      },
      include: {
        translations: true,
      },
    });

    // Invalidate cache
    await cache.deletePattern('products:*');

    return product;
  }

  /**
   * Update product
   */
  async updateProduct(
    id: string,
    data: {
      code?: string;
      type?: string;
      isStocked?: boolean;
      translations?: Translation[];
    }
  ) {
    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    // If code is being changed, check for duplicates
    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.product.findUnique({
        where: { code: data.code },
      });

      if (duplicate) {
        throw new AppError('Product code already exists', 400);
      }
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code }),
        ...(data.type && { type: data.type as any }),
        ...(data.isStocked !== undefined && { isStocked: data.isStocked }),
      },
      include: {
        translations: true,
      },
    });

    // Update translations if provided
    if (data.translations) {
      // Delete existing translations
      await prisma.productTranslation.deleteMany({
        where: { productId: id },
      });

      // Create new translations
      await prisma.productTranslation.createMany({
        data: data.translations.map(t => ({
          productId: id,
          ...t,
        })),
      });
    }

    // Invalidate cache
    await cache.delete(`product:${id}:tr`);
    await cache.delete(`product:${id}:en`);
    await cache.deletePattern('products:*');

    return product;
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(id: string) {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bomParent: true,
            bomChild: true,
            inventoryLots: true,
            workOrders: true,
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check if product is being used
    if (product._count.bomParent > 0) {
      throw new AppError('Cannot delete product with BOM items', 400);
    }

    if (product._count.bomChild > 0) {
      throw new AppError('Cannot delete product used in other BOMs', 400);
    }

    if (product._count.workOrders > 0) {
      throw new AppError('Cannot delete product with work orders', 400);
    }

    // Soft delete
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    // Invalidate cache
    await cache.delete(`product:${id}:tr`);
    await cache.delete(`product:${id}:en`);
    await cache.deletePattern('products:*');

    return { message: 'Product deleted successfully' };
  }

  /**
   * Get product stock summary
   */
  async getProductStock(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const stockSummary = await prisma.inventoryLot.aggregate({
      where: {
        productId: id,
        status: 'ACTIVE',
      },
      _sum: {
        currentQuantity: true,
      },
      _count: true,
    });

    return {
      productId: id,
      productCode: product.code,
      totalQuantity: stockSummary._sum.currentQuantity || 0,
      lotCount: stockSummary._count,
    };
  }

  /**
   * Get product usage statistics
   */
  async getProductUsage(id: string) {
    const [bomUsage, workOrders, inventoryMovement] = await Promise.all([
      // Where is this product used in BOMs
      prisma.bomItem.findMany({
        where: {
          childProductId: id,
          isActive: true,
        },
        include: {
          parentProduct: {
            include: {
              translations: {
                where: { languageCode: 'tr' },
              },
            },
          },
        },
      }),

      // Work orders for this product
      prisma.workOrder.count({
        where: { productId: id },
      }),

      // Inventory movement in last 30 days
      prisma.inventoryTransaction.count({
        where: {
          lot: { productId: id },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      usedInBOMs: bomUsage.length,
      bomDetails: bomUsage,
      totalWorkOrders: workOrders,
      recentTransactions: inventoryMovement,
    };
  }

  /**
   * Get products by type
   */
  async getProductsByType(type: string, languageCode: string = 'tr') {
    return await prisma.product.findMany({
      where: {
        type: type as any,
        isActive: true,
      },
      include: {
        translations: {
          where: { languageCode },
        },
      },
      orderBy: {
        code: 'asc',
      },
    });
  }

  /**
   * Search products
   */
  async searchProducts(query: string, languageCode: string = 'tr', limit: number = 20) {
    return await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { code: { contains: query, mode: 'insensitive' } },
          {
            translations: {
              some: {
                languageCode,
                name: { contains: query, mode: 'insensitive' },
              },
            },
          },
        ],
      },
      include: {
        translations: {
          where: { languageCode },
        },
      },
      take: limit,
    });
  }

  /**
   * Bulk import products
   */
  async bulkImportProducts(products: any[], userId: string) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const productData of products) {
      try {
        await this.createProduct(productData, userId);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          code: productData.code,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Get product types summary
   */
  async getProductTypesSummary() {
    const summary = await prisma.product.groupBy({
      by: ['type'],
      where: { isActive: true },
      _count: true,
    });

    return summary.map(item => ({
      type: item.type,
      count: item._count,
    }));
  }
}

export default new ProductsService();
