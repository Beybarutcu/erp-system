import { prisma } from '@shared/database/client';
import { Prisma } from '@prisma/client';
import { AppError } from '@shared/middleware/error-handler';
import { cache } from '@shared/database/redis';
import { 
  PaginationParams, 
  PaginatedResponse 
} from '@shared/types';
import { createPaginatedResponse } from '@shared/utils/helpers';

export class ShippingService {
  /**
   * Get all shipments
   */
  async getShipments(
    params: PaginationParams & {
      status?: string;
      orderId?: string;
      customerId?: string;
    }
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 50, sortBy = 'shipmentDate', sortOrder = 'desc', status, orderId, customerId } = params;

    const where: Prisma.ShipmentWhereInput = {};

    if (status) where.status = status as any;
    if (orderId) where.orderId = orderId;
    if (customerId) where.customerId = customerId;

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          order: {
            include: {
              customer: true,
            },
          },
          customer: true,
          items: {
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
              orderItem: {
                include: {
                  product: {
                    include: {
                      translations: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.shipment.count({ where }),
    ]);

    return createPaginatedResponse(shipments, total, params);
  }

  /**
   * Get shipment by ID
   */
  async getShipmentById(id: string) {
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            items: true,
          },
        },
        customer: true,
        items: {
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
            orderItem: {
              include: {
                product: {
                  include: {
                    translations: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!shipment) {
      throw new AppError('Shipment not found', 404);
    }

    return shipment;
  }

  /**
   * Create shipment
   */
  async createShipment(
    data: {
      orderId?: string;
      customerId: string;
      shipmentDate: Date;
      carrier?: string;
      trackingNumber?: string;
      notes?: string;
      items: Array<{
        lotId: string;
        quantity: number;
        orderItemId?: string;
      }>;
    },
    userId: string
  ) {
    // Validate customer
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Validate order if provided
    if (data.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }
    }

    // Validate lots
    const lotIds = data.items.map(item => item.lotId);
    const lots = await prisma.inventoryLot.findMany({
      where: { id: { in: lotIds } },
    });

    if (lots.length !== lotIds.length) {
      throw new AppError('One or more lots not found', 404);
    }

    const shipmentNumber = await this.generateShipmentNumber();

    const shipment = await prisma.shipment.create({
      data: {
        shipmentNumber,
        orderId: data.orderId,
        customerId: data.customerId,
        shipmentDate: data.shipmentDate,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        notes: data.notes,
        status: 'PENDING',
        createdBy: userId,
        items: {
          create: data.items.map(item => ({
            lotId: item.lotId,
            quantity: item.quantity,
            orderItemId: item.orderItemId,
          })),
        },
      },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
        customer: true,
        items: {
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
        },
      },
    });

    await cache.deletePattern('shipments:*');

    return shipment;
  }

  /**
   * Update shipment
   */
  async updateShipment(
    id: string,
    data: {
      shipmentDate?: Date;
      deliveredDate?: Date;
      carrier?: string;
      trackingNumber?: string;
      notes?: string;
      status?: string;
    }
  ) {
    const existing = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Shipment not found', 404);
    }

    const shipment = await prisma.shipment.update({
      where: { id },
      data: {
        shipmentDate: data.shipmentDate,
        deliveredDate: data.deliveredDate,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        notes: data.notes,
        status: data.status as any,
      },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
        customer: true,
        items: true,
      },
    });

    await cache.deletePattern('shipments:*');

    return shipment;
  }

  /**
   * Mark as shipped
   */
  async markAsShipped(id: string) {
    return await this.updateShipment(id, {
      status: 'SHIPPED',
      shipmentDate: new Date(),
    });
  }

  /**
   * Mark as delivered
   */
  async markAsDelivered(id: string) {
    return await this.updateShipment(id, {
      status: 'DELIVERED',
      deliveredDate: new Date(),
    });
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(id: string, reason?: string) {
    const shipment = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      throw new AppError('Shipment not found', 404);
    }

    if (shipment.status === 'DELIVERED') {
      throw new AppError('Cannot cancel delivered shipment', 400);
    }

    const updated = await prisma.shipment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `${shipment.notes || ''}\nCancelled: ${reason}` : shipment.notes,
      },
    });

    await cache.deletePattern('shipments:*');

    return updated;
  }

  /**
   * Add shipment item
   */
  async addShipmentItem(
    shipmentId: string,
    data: {
      lotId: string;
      quantity: number;
      orderItemId?: string;
    }
  ) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new AppError('Shipment not found', 404);
    }

    if (shipment.status !== 'PENDING' && shipment.status !== 'PREPARED') {
      throw new AppError('Can only add items to pending/prepared shipments', 400);
    }

    const lot = await prisma.inventoryLot.findUnique({
      where: { id: data.lotId },
    });

    if (!lot) {
      throw new AppError('Lot not found', 404);
    }

    const item = await prisma.shipmentItem.create({
      data: {
        shipmentId,
        lotId: data.lotId,
        quantity: data.quantity,
        orderItemId: data.orderItemId,
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
    });

    await cache.deletePattern('shipments:*');

    return item;
  }

  /**
   * Delete shipment item
   */
  async deleteShipmentItem(itemId: string) {
    const item = await prisma.shipmentItem.findUnique({
      where: { id: itemId },
      include: { shipment: true },
    });

    if (!item) {
      throw new AppError('Shipment item not found', 404);
    }

    if (item.shipment.status !== 'PENDING' && item.shipment.status !== 'PREPARED') {
      throw new AppError('Can only delete items from pending/prepared shipments', 400);
    }

    await prisma.shipmentItem.delete({
      where: { id: itemId },
    });

    await cache.deletePattern('shipments:*');

    return { message: 'Shipment item deleted successfully' };
  }

  /**
   * Get shipment statistics
   */
  async getShipmentStats(startDate?: Date, endDate?: Date) {
    const where: Prisma.ShipmentWhereInput = {};

    if (startDate || endDate) {
      where.shipmentDate = {};
      if (startDate) where.shipmentDate.gte = startDate;
      if (endDate) where.shipmentDate.lte = endDate;
    }

    const [statusCounts, total] = await Promise.all([
      prisma.shipment.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),

      prisma.shipment.count({ where }),
    ]);

    return {
      total,
      byStatus: statusCounts.map(item => ({
        status: item.status,
        count: item._count,
      })),
    };
  }

  // Helper methods

  private async generateShipmentNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const prefix = `SHP-${year}${month}`;

    const lastShipment = await prisma.shipment.findFirst({
      where: {
        shipmentNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        shipmentNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastShipment) {
      const lastSequence = parseInt(lastShipment.shipmentNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }
}

export default new ShippingService();