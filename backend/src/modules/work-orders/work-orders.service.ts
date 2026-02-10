import { prisma } from '@shared/database/client';
import { Prisma, WorkOrderStatus } from '@prisma/client';
import { AppError } from '@shared/middleware/error-handler';
import { cache } from '@shared/database/redis';
import { WebSocketService } from '@shared/utils/websocket';
import inventoryService from '@modules/inventory/inventory.service';
import { 
  PaginationParams, 
  PaginatedResponse,
  WorkOrderProgress 
} from '@shared/types';
import { 
  createPaginatedResponse,
  calculateProgress,
  generateCode 
} from '@shared/utils/helpers';
import { Decimal } from '@prisma/client/runtime/library';

export class WorkOrdersService {
  /**
   * Get all work orders with filters
   */
  async getWorkOrders(
    params: PaginationParams & {
      status?: WorkOrderStatus;
      machineId?: string;
      productId?: string;
      orderId?: string;
      startDate?: string;
      endDate?: string;
    },
    languageCode: string = 'tr'
  ): Promise<PaginatedResponse<any>> {
    const { 
      page = 1, 
      limit = 50, 
      sortBy = 'plannedStartDate', 
      sortOrder = 'asc',
      status,
      machineId,
      productId,
      orderId,
      startDate,
      endDate 
    } = params;

    const where: Prisma.WorkOrderWhereInput = {};

    if (status) where.status = status;
    if (machineId) where.machineId = machineId;
    if (productId) where.productId = productId;
    if (orderId) where.orderId = orderId;

    if (startDate || endDate) {
      where.plannedStartDate = {};
      if (startDate) where.plannedStartDate.gte = new Date(startDate);
      if (endDate) where.plannedStartDate.lte = new Date(endDate);
    }

    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: {
          product: {
            include: {
              translations: { where: { languageCode } },
            },
          },
          machine: {
            include: {
              translations: { where: { languageCode } },
            },
          },
          order: true,
          bomItem: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.workOrder.count({ where }),
    ]);

    // Add progress calculation
    const workOrdersWithProgress = workOrders.map(wo => ({
      ...wo,
      progress: this.calculateWorkOrderProgress(wo),
    }));

    return createPaginatedResponse(workOrdersWithProgress, total, params);
  }

  /**
   * Get work order by ID
   */
  async getWorkOrderById(id: string, languageCode: string = 'tr') {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            translations: { where: { languageCode } },
          },
        },
        machine: {
          include: {
            translations: { where: { languageCode } },
          },
        },
        order: {
          include: {
            customer: true,
          },
        },
        bomItem: {
          include: {
            translations: { where: { languageCode } },
          },
        },
        operations: {
          orderBy: { createdAt: 'desc' },
        },
        outsourcingJobs: {
          include: {
            supplier: true,
          },
        },
      },
    });

    if (!workOrder) {
      throw new AppError('Work order not found', 404);
    }

    return {
      ...workOrder,
      progress: this.calculateWorkOrderProgress(workOrder),
    };
  }

  /**
   * Create work order
   */
  async createWorkOrder(
    data: {
      productId: string;
      bomItemId?: string;
      orderId?: string;
      plannedQuantity: number;
      machineId?: string;
      plannedStartDate?: Date;
      plannedEndDate?: Date;
      priority?: number;
      isOutsourced?: boolean;
      outsourceSupplierId?: string;
    },
    userId: string
  ) {
    // Generate WO number
    const woNumber = await this.generateWONumber();

    // Validate product
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Validate machine if provided
    if (data.machineId) {
      const machine = await prisma.machine.findUnique({
        where: { id: data.machineId },
      });

      if (!machine) {
        throw new AppError('Machine not found', 404);
      }

      if (machine.status !== 'ACTIVE') {
        throw new AppError('Machine is not active', 400);
      }
    }

    // Create work order
    const workOrder = await prisma.workOrder.create({
      data: {
        woNumber,
        productId: data.productId,
        bomItemId: data.bomItemId,
        orderId: data.orderId,
        plannedQuantity: data.plannedQuantity,
        machineId: data.machineId,
        plannedStartDate: data.plannedStartDate,
        plannedEndDate: data.plannedEndDate,
        priority: data.priority || 5,
        isOutsourced: data.isOutsourced || false,
        outsourceSupplierId: data.outsourceSupplierId,
        status: 'PLANNED',
        createdBy: userId,
      },
      include: {
        product: {
          include: {
            translations: true,
          },
        },
        machine: {
          include: {
            translations: true,
          },
        },
      },
    });

    // Invalidate cache
    await cache.deletePattern('work-orders:*');

    // Emit WebSocket event
    WebSocketService.broadcast('work-order:created', workOrder);

    return workOrder;
  }

  /**
   * Start work order
   */
  async startWorkOrder(
    id: string,
    data: {
      machineId?: string;
      operatorId?: string;
    },
    userId: string
  ) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        product: true,
        bomItem: true,
      },
    });

    if (!workOrder) {
      throw new AppError('Work order not found', 404);
    }

    if (workOrder.status !== 'PLANNED') {
      throw new AppError('Work order can only be started from PLANNED status', 400);
    }

    // Check material availability if BOM exists
    if (workOrder.bomItem) {
      const materialCheck = await this.checkMaterialAvailability(
        workOrder.productId,
        workOrder.plannedQuantity
      );

      if (!materialCheck.available) {
        throw new AppError(
          `Insufficient materials: ${materialCheck.shortages.join(', ')}`,
          400
        );
      }
    }

    // Update work order
    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        actualStartDate: new Date(),
        ...(data.machineId && { machineId: data.machineId }),
      },
      include: {
        product: {
          include: {
            translations: true,
          },
        },
        machine: {
          include: {
            translations: true,
          },
        },
      },
    });

    // Create operation record
    await prisma.workOrderOperation.create({
      data: {
        workOrderId: id,
        operationSequence: 1,
        startTime: new Date(),
        operatorId: data.operatorId || userId,
        notes: 'Work order started',
      },
    });

    // Invalidate cache
    await cache.deletePattern('work-orders:*');

    // Emit WebSocket event
    WebSocketService.broadcast('work-order:started', updated);
    if (data.machineId) {
      WebSocketService.emitToMachine(data.machineId, 'machine:work-order-started', updated);
    }

    return updated;
  }

  /**
   * Record production
   */
  async recordProduction(
    id: string,
    data: {
      quantityProduced: number;
      quantityScrap?: number;
      operatorId?: string;
      notes?: string;
    },
    userId: string
  ) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        product: true,
        bomItem: {
          include: {
            childProduct: true,
          },
        },
      },
    });

    if (!workOrder) {
      throw new AppError('Work order not found', 404);
    }

    if (workOrder.status !== 'IN_PROGRESS') {
      throw new AppError('Work order must be in progress to record production', 400);
    }

    const newProduced = new Decimal(workOrder.producedQuantity).plus(data.quantityProduced);
    const newScrap = new Decimal(workOrder.scrapQuantity).plus(data.quantityScrap || 0);
    const totalProcessed = newProduced.plus(newScrap);

    if (totalProcessed.greaterThan(workOrder.plannedQuantity)) {
      throw new AppError('Total production exceeds planned quantity', 400);
    }

    // Consume materials if BOM exists
    if (workOrder.bomItem) {
      await inventoryService.consumeStock({
        productId: workOrder.bomItem.childProductId,
        quantity: new Decimal(data.quantityProduced)
          .times(workOrder.bomItem.quantity)
          .toNumber(),
        workOrderId: id,
      }, userId);
    }

    // Update work order
    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        producedQuantity: newProduced.toNumber(),
        scrapQuantity: newScrap.toNumber(),
      },
    });

    // Create operation record
    await prisma.workOrderOperation.create({
      data: {
        workOrderId: id,
        operationSequence: await this.getNextOperationSequence(id),
        quantityCompleted: data.quantityProduced,
        operatorId: data.operatorId || userId,
        notes: data.notes,
        endTime: new Date(),
      },
    });

    // Create inventory lot for produced items
    if (workOrder.product.isStocked && data.quantityProduced > 0) {
      await this.createProductionLot(
        workOrder.productId,
        data.quantityProduced,
        id
      );
    }

    // Check if work order is complete
    if (totalProcessed.greaterThanOrEqualTo(workOrder.plannedQuantity)) {
      await this.completeWorkOrder(id);
    }

    // Invalidate cache
    await cache.deletePattern('work-orders:*');

    const result = {
      ...updated,
      progress: this.calculateWorkOrderProgress(updated),
    };

    // Emit WebSocket event
    WebSocketService.broadcast('work-order:updated', result);

    return result;
  }

  /**
   * Pause work order
   */
  async pauseWorkOrder(id: string, reason?: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new AppError('Work order not found', 404);
    }

    if (workOrder.status !== 'IN_PROGRESS') {
      throw new AppError('Can only pause work orders in progress', 400);
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'PAUSED',
      },
      include: {
        product: {
          include: {
            translations: true,
          },
        },
      },
    });

    // Invalidate cache
    await cache.deletePattern('work-orders:*');

    // Emit WebSocket event
    WebSocketService.broadcast('work-order:paused', { ...updated, reason });

    return updated;
  }

  /**
   * Resume work order
   */
  async resumeWorkOrder(id: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new AppError('Work order not found', 404);
    }

    if (workOrder.status !== 'PAUSED') {
      throw new AppError('Can only resume paused work orders', 400);
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
      },
      include: {
        product: {
          include: {
            translations: true,
          },
        },
      },
    });

    // Invalidate cache
    await cache.deletePattern('work-orders:*');

    // Emit WebSocket event
    WebSocketService.broadcast('work-order:resumed', updated);

    return updated;
  }

  /**
   * Complete work order
   */
  async completeWorkOrder(id: string) {
    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualEndDate: new Date(),
      },
      include: {
        product: {
          include: {
            translations: true,
          },
        },
        machine: {
          include: {
            translations: true,
          },
        },
      },
    });

    // Invalidate cache
    await cache.deletePattern('work-orders:*');

    // Emit WebSocket event
    WebSocketService.broadcast('work-order:completed', updated);

    return updated;
  }

  /**
   * Cancel work order
   */
  async cancelWorkOrder(id: string, reason: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new AppError('Work order not found', 404);
    }

    if (workOrder.status === 'COMPLETED') {
      throw new AppError('Cannot cancel completed work order', 400);
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    // Invalidate cache
    await cache.deletePattern('work-orders:*');

    return updated;
  }

  /**
   * Get work order timeline
   */
  async getWorkOrderTimeline(id: string) {
    const operations = await prisma.workOrderOperation.findMany({
      where: { workOrderId: id },
      include: {
        operator: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return operations;
  }

  /**
   * Get work order material usage
   */
  async getMaterialUsage(id: string) {
    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        referenceType: 'WORK_ORDER',
        referenceId: id,
        transactionType: 'OUT',
      },
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions;
  }

  // Helper methods

  private calculateWorkOrderProgress(workOrder: any): WorkOrderProgress {
    const planned = Number(workOrder.plannedQuantity);
    const produced = Number(workOrder.producedQuantity);
    const scrap = Number(workOrder.scrapQuantity);
    const remaining = Math.max(0, planned - produced - scrap);

    return {
      plannedQuantity: planned,
      producedQuantity: produced,
      scrapQuantity: scrap,
      remainingQuantity: remaining,
      progressPercentage: calculateProgress(planned, produced, scrap),
    };
  }

  private async generateWONumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const count = await prisma.workOrder.count({
      where: {
        createdAt: {
          gte: new Date(year, date.getMonth(), 1),
        },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `WO-${year}${month}-${sequence}`;
  }

  private async getNextOperationSequence(workOrderId: string): Promise<number> {
    const lastOp = await prisma.workOrderOperation.findFirst({
      where: { workOrderId },
      orderBy: { operationSequence: 'desc' },
    });

    return (lastOp?.operationSequence || 0) + 1;
  }

  private async checkMaterialAvailability(
    productId: string,
    quantity: number
  ): Promise<{ available: boolean; shortages: string[] }> {
    // Get BOM for product
    const bomItems = await prisma.bomItem.findMany({
      where: {
        parentProductId: productId,
        isActive: true,
      },
      include: {
        childProduct: true,
      },
    });

    const shortages: string[] = [];

    for (const item of bomItems) {
      const required = new Decimal(quantity)
        .times(item.quantity)
        .times(1 + item.scrapRate.toNumber() / 100);

      const available = await prisma.inventoryLot.aggregate({
        where: {
          productId: item.childProductId,
          status: 'ACTIVE',
        },
        _sum: {
          currentQuantity: true,
        },
      });

      const availableQty = available._sum.currentQuantity || new Decimal(0);

      if (availableQty.lessThan(required)) {
        shortages.push(
          `${item.childProduct.code}: needed ${required.toFixed(2)}, available ${availableQty.toFixed(2)}`
        );
      }
    }

    return {
      available: shortages.length === 0,
      shortages,
    };
  }

  private async createProductionLot(
    productId: string,
    quantity: number,
    workOrderId: string
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) return;

    const lotNumber = `${product.code}-${Date.now()}`;

    await prisma.inventoryLot.create({
      data: {
        lotNumber,
        productId,
        initialQuantity: quantity,
        currentQuantity: quantity,
        workOrderId,
        status: 'ACTIVE',
      },
    });

    await prisma.inventoryTransaction.create({
      data: {
        lotId: (await prisma.inventoryLot.findUnique({ where: { lotNumber } }))!.id,
        transactionType: 'IN',
        quantity,
        referenceType: 'WORK_ORDER',
        referenceId: workOrderId,
        notes: 'Production output',
      },
    });
  }
}

export default new WorkOrdersService();
