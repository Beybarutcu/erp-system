import { prisma } from '@shared/database/client';
import { Prisma, OrderStatus } from '@prisma/client';
import { AppError } from '@shared/middleware/error-handler';
import { cache } from '@shared/database/redis';
import { WebSocketService } from '@shared/utils/websocket';
import { 
  PaginationParams, 
  PaginatedResponse 
} from '@shared/types';
import { createPaginatedResponse } from '@shared/utils/helpers';
import { Decimal } from '@prisma/client/runtime/library';

export class OrdersService {
  async getOrders(
    params: PaginationParams & {
      status?: OrderStatus;
      customerId?: string;
      search?: string;
    }
  ): Promise<PaginatedResponse<any>> {
    const { 
      page = 1, 
      limit = 50, 
      sortBy = 'orderDate', 
      sortOrder = 'desc',
      status,
      customerId,
      search 
    } = params;

    const where: Prisma.OrderWhereInput = {};

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: {
              product: {
                include: {
                  translations: true,
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return createPaginatedResponse(orders, total, params);
  }

  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                translations: true,
              },
            },
          },
        },
        workOrders: {
          include: {
            product: {
              include: {
                translations: true,
              },
            },
            machine: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  async createOrder(
    data: {
      customerId: string;
      orderDate: Date;
      deliveryDate?: Date;
      notes?: string;
      items: Array<{
        productId: string;
        quantity: number;
        unitPrice?: number;
        notes?: string;
      }>;
    },
    userId: string
  ) {
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const orderNumber = await this.generateOrderNumber();

    const totalAmount = data.items.reduce((sum, item) => {
      return sum + (item.unitPrice || 0) * item.quantity;
    }, 0);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        orderDate: data.orderDate,
        deliveryDate: data.deliveryDate,
        totalAmount,
        notes: data.notes,
        status: 'PENDING',
        createdBy: userId,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice || 0,
            notes: item.notes,
          })),
        },
      },
      include: {
        customer: true,
        items: {
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

    await cache.deletePattern('orders:*');

    WebSocketService.broadcast('order:created', {
      orderId: order.id,
      orderNumber: order.orderNumber,
    });

    return order;
  }

  async updateOrder(
    id: string,
    data: {
      deliveryDate?: Date;
      notes?: string;
      status?: OrderStatus;
    }
  ) {
    const existing = await prisma.order.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Order not found', 404);
    }

    if (existing.status === 'COMPLETED') {
      throw new AppError('Cannot update completed order', 400);
    }

    const order = await prisma.order.update({
      where: { id },
      data,
      include: {
        customer: true,
        items: true,
      },
    });

    await cache.deletePattern('orders:*');

    return order;
  }

  async cancelOrder(id: string, reason?: string) {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status === 'COMPLETED') {
      throw new AppError('Cannot cancel completed order', 400);
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `${order.notes || ''}\nCancelled: ${reason}` : order.notes,
      },
    });

    await cache.deletePattern('orders:*');

    return updated;
  }

  /**
   * Add order item
   */
  async addOrderItem(
    orderId: string,
    data: {
      productId: string;
      quantity: number;
      unitPrice?: number;
      notes?: string;
    }
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status !== 'PENDING') {
      throw new AppError('Can only add items to pending orders', 400);
    }

    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const item = await prisma.orderItem.create({
      data: {
        orderId,
        productId: data.productId,
        quantity: data.quantity,
        unitPrice: data.unitPrice || 0,
        notes: data.notes,
      },
      include: {
        product: {
          include: {
            translations: true,
          },
        },
      },
    });

    // Update order total
    const itemTotal = (data.unitPrice || 0) * data.quantity;
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        totalAmount: {
          increment: itemTotal,
        },
      },
    });

    await cache.deletePattern('orders:*');

    return item;
  }

  /**
   * Update order item
   */
  async updateOrderItem(
    itemId: string,
    data: {
      quantity?: number;
      unitPrice?: number;
      notes?: string;
    }
  ) {
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true },
    });

    if (!item) {
      throw new AppError('Order item not found', 404);
    }

    if (item.order.status !== 'PENDING') {
      throw new AppError('Can only update items in pending orders', 400);
    }

    // Calculate old total
    const oldTotal = Number(item.unitPrice || 0) * Number(item.quantity);
    
    // Get new values
    const newQuantity = data.quantity !== undefined ? data.quantity : Number(item.quantity);
    const newUnitPrice = data.unitPrice !== undefined ? data.unitPrice : Number(item.unitPrice || 0);
    const newTotal = newQuantity * newUnitPrice;

    const updated = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        quantity: newQuantity,
        unitPrice: newUnitPrice,
        notes: data.notes,
      },
    });

    // Update order total
    const totalDiff = newTotal - oldTotal;
    await prisma.order.update({
      where: { id: item.orderId },
      data: {
        totalAmount: {
          increment: totalDiff,
        },
      },
    });

    await cache.deletePattern('orders:*');

    return updated;
  }

  /**
   * Delete order item
   */
  async deleteOrderItem(itemId: string) {
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true },
    });

    if (!item) {
      throw new AppError('Order item not found', 404);
    }

    if (item.order.status !== 'PENDING') {
      throw new AppError('Can only delete items from pending orders', 400);
    }

    // Calculate item total
    const itemTotal = Number(item.unitPrice || 0) * Number(item.quantity);

    await prisma.orderItem.delete({
      where: { id: itemId },
    });

    // Update order total
    await prisma.order.update({
      where: { id: item.orderId },
      data: {
        totalAmount: {
          decrement: itemTotal,
        },
      },
    });

    await cache.deletePattern('orders:*');

    return { message: 'Order item deleted successfully' };
  }

  async getOrderStats(startDate?: Date, endDate?: Date) {
    const where: Prisma.OrderWhereInput = {};

    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate.gte = startDate;
      if (endDate) where.orderDate.lte = endDate;
    }

    const [statusCounts, totalStats] = await Promise.all([
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),

      prisma.order.aggregate({
        where,
        _count: true,
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    return {
      byStatus: statusCounts,
      totalOrders: totalStats._count,
      totalRevenue: totalStats._sum.totalAmount || 0,
    };
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const prefix = `ORD-${year}${month}`;

    const lastOrder = await prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }
}

export default new OrdersService();