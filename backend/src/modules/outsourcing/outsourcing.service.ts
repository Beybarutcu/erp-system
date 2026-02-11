import { prisma } from '@shared/database/client';
import { Prisma } from '@prisma/client';
import { AppError } from '@shared/middleware/error-handler';
import { cache } from '@shared/database/redis';
import { 
  PaginationParams, 
  PaginatedResponse 
} from '@shared/types';
import { createPaginatedResponse } from '@shared/utils/helpers';

export class OutsourcingService {
  /**
   * Get all outsourcing jobs
   */
  async getOutsourcingJobs(
    params: PaginationParams & {
      status?: string;
      supplierId?: string;
    }
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 50, sortBy = 'startDate', sortOrder = 'desc', status, supplierId } = params;

    const where: Prisma.OutsourcingJobWhereInput = {};

    if (status) where.status = status as any;
    if (supplierId) where.supplierId = supplierId;

    const [jobs, total] = await Promise.all([
      prisma.outsourcingJob.findMany({
        where,
        include: {
          supplier: true,
          product: {
            include: {
              translations: true,
            },
          },
          workOrder: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.outsourcingJob.count({ where }),
    ]);

    return createPaginatedResponse(jobs, total, params);
  }

  /**
   * Get outsourcing job by ID
   */
  async getOutsourcingJobById(id: string) {
    const job = await prisma.outsourcingJob.findUnique({
      where: { id },
      include: {
        supplier: true,
        product: {
          include: {
            translations: true,
          },
        },
        workOrder: {
          include: {
            product: {
              include: {
                translations: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new AppError('Outsourcing job not found', 404);
    }

    return job;
  }

  /**
   * Create outsourcing job
   */
  async createOutsourcingJob(
    data: {
      supplierId: string;
      productId: string;
      workOrderId?: string;
      quantity: number;
      unitCost?: number;
      startDate: Date;
      expectedEndDate: Date;
      notes?: string;
    },
    userId: string
  ) {
    // Validate supplier
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplierId },
    });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    if (supplier.type !== 'OUTSOURCING') {
      throw new AppError('Supplier is not an outsourcing provider', 400);
    }

    // Validate product
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const jobNumber = await this.generateJobNumber();

    const job = await prisma.outsourcingJob.create({
      data: {
        jobNumber,
        supplierId: data.supplierId,
        productId: data.productId,
        workOrderId: data.workOrderId,
        quantity: data.quantity,
        unitCost: data.unitCost || 0,
        totalCost: (data.unitCost || 0) * data.quantity,
        startDate: data.startDate,
        expectedEndDate: data.expectedEndDate,
        notes: data.notes,
        status: 'PENDING',
        createdBy: userId,
      },
      include: {
        supplier: true,
        product: {
          include: {
            translations: true,
          },
        },
      },
    });

    await cache.deletePattern('outsourcing:*');

    return job;
  }

  /**
   * Update outsourcing job
   */
  async updateOutsourcingJob(
    id: string,
    data: {
      quantity?: number;
      unitCost?: number;
      startDate?: Date;
      expectedEndDate?: Date;
      actualEndDate?: Date;
      receivedQuantity?: number;
      notes?: string;
      status?: string;
    }
  ) {
    const existing = await prisma.outsourcingJob.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Outsourcing job not found', 404);
    }

    // Calculate new total cost if quantity or unit cost changed
    let totalCost = existing.totalCost;
    if (data.quantity || data.unitCost) {
      const newQuantity = data.quantity || Number(existing.quantity);
      const newUnitCost = data.unitCost !== undefined ? data.unitCost : Number(existing.unitCost);
      totalCost = newQuantity * newUnitCost;
    }

    const job = await prisma.outsourcingJob.update({
      where: { id },
      data: {
        quantity: data.quantity,
        unitCost: data.unitCost,
        totalCost,
        startDate: data.startDate,
        expectedEndDate: data.expectedEndDate,
        actualEndDate: data.actualEndDate,
        receivedQuantity: data.receivedQuantity,
        notes: data.notes,
        status: data.status as any,
      },
      include: {
        supplier: true,
        product: {
          include: {
            translations: true,
          },
        },
      },
    });

    await cache.deletePattern('outsourcing:*');

    return job;
  }

  /**
   * Start outsourcing job
   */
  async startJob(id: string) {
    return await this.updateOutsourcingJob(id, {
      status: 'IN_PROGRESS',
      startDate: new Date(),
    });
  }

  /**
   * Complete outsourcing job
   */
  async completeJob(id: string, receivedQuantity: number) {
    const job = await prisma.outsourcingJob.findUnique({
      where: { id },
    });

    if (!job) {
      throw new AppError('Outsourcing job not found', 404);
    }

    return await this.updateOutsourcingJob(id, {
      status: 'COMPLETED',
      actualEndDate: new Date(),
      receivedQuantity,
    });
  }

  /**
   * Cancel outsourcing job
   */
  async cancelJob(id: string, reason?: string) {
    const job = await prisma.outsourcingJob.findUnique({
      where: { id },
    });

    if (!job) {
      throw new AppError('Outsourcing job not found', 404);
    }

    if (job.status === 'COMPLETED') {
      throw new AppError('Cannot cancel completed job', 400);
    }

    const updated = await prisma.outsourcingJob.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `${job.notes || ''}\nCancelled: ${reason}` : job.notes,
      },
    });

    await cache.deletePattern('outsourcing:*');

    return updated;
  }

  /**
   * Get outsourcing statistics
   */
  async getOutsourcingStats(startDate?: Date, endDate?: Date) {
    const where: Prisma.OutsourcingJobWhereInput = {};

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = startDate;
      if (endDate) where.startDate.lte = endDate;
    }

    const [statusCounts, costStats] = await Promise.all([
      prisma.outsourcingJob.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),

      prisma.outsourcingJob.aggregate({
        where,
        _sum: {
          totalCost: true,
          quantity: true,
          receivedQuantity: true,
        },
        _count: true,
      }),
    ]);

    return {
      total: costStats._count,
      byStatus: statusCounts.map(item => ({
        status: item.status,
        count: item._count,
      })),
      totalCost: Number(costStats._sum.totalCost || 0),
      totalQuantity: Number(costStats._sum.quantity || 0),
      totalReceived: Number(costStats._sum.receivedQuantity || 0),
    };
  }

  /**
   * Get jobs by supplier
   */
  async getJobsBySupplier(supplierId: string) {
    return await prisma.outsourcingJob.findMany({
      where: { supplierId },
      include: {
        product: {
          include: {
            translations: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  // Helper methods

  private async generateJobNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const prefix = `OUT-${year}${month}`;

    const lastJob = await prisma.outsourcingJob.findFirst({
      where: {
        jobNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        jobNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastJob) {
      const lastSequence = parseInt(lastJob.jobNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }
}

export default new OutsourcingService();