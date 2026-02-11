import { prisma } from '@shared/database/client';
import { Prisma } from '@prisma/client';
import { AppError } from '@shared/middleware/error-handler';
import { cache } from '@shared/database/redis';
import { 
  PaginationParams, 
  PaginatedResponse 
} from '@shared/types';
import { 
  createPaginatedResponse,
  parsePaginationParams 
} from '@shared/utils/helpers';

export class SuppliersService {
  /**
   * Get all suppliers with pagination
   */
  async getSuppliers(
    params: PaginationParams & {
      type?: string;
      search?: string;
    }
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 50, sortBy = 'name', sortOrder = 'asc', type, search } = params;

    const where: Prisma.SupplierWhereInput = {
      isActive: true,
    };

    if (type) {
      where.type = type as any;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          _count: {
            select: {
              inventoryLots: true,
              outsourcingJobs: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.supplier.count({ where }),
    ]);

    return createPaginatedResponse(suppliers, total, params);
  }

  /**
   * Get supplier by ID
   */
  async getSupplierById(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        inventoryLots: {
          orderBy: { receivedDate: 'desc' },
          take: 10,
          include: {
            product: {
              include: {
                translations: true,
              },
            },
          },
        },
        outsourcingJobs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            inventoryLots: true,
            outsourcingJobs: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    return supplier;
  }

  /**
   * Create supplier
   */
  async createSupplier(data: {
    code: string;
    name: string;
    type: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxNumber?: string;
    leadTimeDays?: number;
  }) {
    // Check if code exists
    const existing = await prisma.supplier.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new AppError('Supplier code already exists', 400);
    }

    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        type: data.type as any,
      },
    });

    await cache.deletePattern('suppliers:*');

    return supplier;
  }

  /**
   * Update supplier
   */
  async updateSupplier(
    id: string,
    data: {
      code?: string;
      name?: string;
      type?: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      address?: string;
      taxNumber?: string;
      leadTimeDays?: number;
    }
  ) {
    const existing = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Supplier not found', 404);
    }

    // Check code uniqueness
    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.supplier.findUnique({
        where: { code: data.code },
      });

      if (duplicate) {
        throw new AppError('Supplier code already exists', 400);
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...data,
        ...(data.type && { type: data.type as any }),
      },
    });

    await cache.deletePattern('suppliers:*');

    return supplier;
  }

  /**
   * Delete supplier (soft delete)
   */
  async deleteSupplier(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            inventoryLots: true,
            outsourcingJobs: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    if (supplier._count.inventoryLots > 0 || supplier._count.outsourcingJobs > 0) {
      throw new AppError('Cannot delete supplier with related records', 400);
    }

    await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    await cache.deletePattern('suppliers:*');

    return { message: 'Supplier deleted successfully' };
  }

  /**
   * Get supplier statistics
   */
  async getSupplierStats(id: string) {
    const [materialStats, outsourcingStats] = await Promise.all([
      prisma.inventoryLot.aggregate({
        where: {
          supplierId: id,
        },
        _count: true,
        _sum: {
          initialQuantity: true,
        },
      }),

      prisma.outsourcingJob.aggregate({
        where: {
          supplierId: id,
        },
        _count: true,
      }),
    ]);

    return {
      totalMaterialDeliveries: materialStats._count,
      totalMaterialQuantity: materialStats._sum.initialQuantity || 0,
      totalOutsourcingJobs: outsourcingStats._count,
    };
  }

  /**
   * Search suppliers
   */
  async searchSuppliers(query: string, type?: string, limit: number = 20) {
    const where: Prisma.SupplierWhereInput = {
      isActive: true,
      OR: [
        { code: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (type) {
      where.type = type as any;
    }

    return await prisma.supplier.findMany({
      where,
      take: limit,
    });
  }

  /**
   * Get suppliers by type
   */
  async getSuppliersByType(type: string) {
    return await prisma.supplier.findMany({
      where: {
        isActive: true,
        type: type as any,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}

export default new SuppliersService();