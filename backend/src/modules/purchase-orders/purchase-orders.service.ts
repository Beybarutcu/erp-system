// ============================================
// PURCHASE ORDERS SERVICE
// backend/src/modules/purchase-orders/purchase-orders.service.ts
// ============================================

import { prisma } from '@shared/database/client';
import { AppError } from '@shared/middleware/error-handler';
import { Prisma } from '@prisma/client';
import {
  PurchaseOrderFilters,
  CreatePurchaseOrderDTO,
  UpdatePurchaseOrderDTO,
  ReceivePurchaseOrderDTO,
  CreateConfirmationDTO,
  PurchaseOrderStats,
  SupplierPurchaseHistory,
  PendingReceiveReport,
} from './purchase-orders.types';

export class PurchaseOrdersService {
  // ============================================
  // CRUD OPERATIONS
  // ============================================

  async getPurchaseOrders(filters: PurchaseOrderFilters = {}, languageCode: string = 'tr') {
    const { page = 1, limit = 20, sortBy = 'orderDate', sortOrder = 'desc', ...restFilters } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseOrderWhereInput = {};

    if (restFilters.supplierId) {
      where.supplierId = restFilters.supplierId;
    }

    if (restFilters.status) {
      where.status = restFilters.status;
    }

    if (restFilters.startDate || restFilters.endDate) {
      where.orderDate = {};
      if (restFilters.startDate) {
        where.orderDate.gte = restFilters.startDate;
      }
      if (restFilters.endDate) {
        where.orderDate.lte = restFilters.endDate;
      }
    }

    if (restFilters.search) {
      where.OR = [
        { orderNumber: { contains: restFilters.search, mode: 'insensitive' } },
        { supplier: { name: { contains: restFilters.search, mode: 'insensitive' } } },
      ];
    }

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: true,
          items: {
            include: {
              product: {
                include: {
                  translations: {
                    where: { languageCode },
                  },
                },
              },
            },
          },
          confirmations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              items: true,
              confirmations: true,
              inventoryLots: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: purchaseOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPurchaseOrderById(id: string, languageCode: string = 'tr') {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: {
              include: {
                translations: {
                  where: { languageCode },
                },
              },
            },
          },
        },
        confirmations: {
          orderBy: { createdAt: 'desc' },
        },
        inventoryLots: {
          include: {
            product: {
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
            items: true,
            confirmations: true,
            inventoryLots: true,
          },
        },
      },
    });

    if (!purchaseOrder) {
      throw new AppError('Purchase order not found', 404);
    }

    return purchaseOrder;
  }

  async createPurchaseOrder(data: CreatePurchaseOrderDTO) {
    // Validate supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplierId },
    });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    // Validate all products exist
    const productIds = data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new AppError('One or more products not found', 404);
    }

    // Generate order number
    const year = new Date().getFullYear();
    const count = await prisma.purchaseOrder.count({
      where: {
        orderDate: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
    });
    const orderNumber = `PO-${year}-${String(count + 1).padStart(3, '0')}`;

    // Calculate total amount
    const totalAmount = data.items.reduce((sum, item) => {
      return sum + (item.unitPrice || 0) * item.quantity;
    }, 0);

    // Create purchase order
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: data.supplierId,
        orderDate: data.orderDate,
        expectedDeliveryDate: data.expectedDeliveryDate,
        paymentTerms: data.paymentTerms,
        notes: data.notes,
        totalAmount,
        status: 'PENDING',
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes,
          })),
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: {
              include: {
                translations: {
                  where: { languageCode: 'tr' },
                },
              },
            },
          },
        },
      },
    });

    return purchaseOrder;
  }

  async updatePurchaseOrder(id: string, data: UpdatePurchaseOrderDTO) {
    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id },
      data,
      include: {
        supplier: true,
        items: true,
      },
    });

    return purchaseOrder;
  }

  async deletePurchaseOrder(id: string) {
    // Check if order has received items
    const hasReceivedItems = await prisma.purchaseOrderItem.findFirst({
      where: {
        purchaseOrderId: id,
        receivedQuantity: { gt: 0 },
      },
    });

    if (hasReceivedItems) {
      throw new AppError('Cannot delete order with received items', 400);
    }

    await prisma.purchaseOrder.delete({
      where: { id },
    });

    return { message: 'Purchase order deleted successfully' };
  }

  // ============================================
  // RECEIVE OPERATIONS
  // ============================================

  async receivePurchaseOrder(data: ReceivePurchaseOrderDTO) {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: data.purchaseOrderId },
      include: {
        items: true,
        supplier: true,
      },
    });

    if (!purchaseOrder) {
      throw new AppError('Purchase order not found', 404);
    }

    if (purchaseOrder.status === 'COMPLETED') {
      throw new AppError('Purchase order already completed', 400);
    }

    if (purchaseOrder.status === 'CANCELLED') {
      throw new AppError('Cannot receive cancelled order', 400);
    }

    // Process in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update items and create inventory lots
      for (const item of data.items) {
        const poItem = purchaseOrder.items.find((i) => i.id === item.itemId);
        if (!poItem) {
          throw new AppError(`Item ${item.itemId} not found in order`, 404);
        }

        const newReceivedQty = Number(poItem.receivedQuantity) + item.receivedQuantity;
        if (newReceivedQty > Number(poItem.quantity)) {
          throw new AppError(`Received quantity exceeds ordered quantity for item ${item.itemId}`, 400);
        }

        // Update purchase order item
        await tx.purchaseOrderItem.update({
          where: { id: item.itemId },
          data: {
            receivedQuantity: newReceivedQty,
            receivedDate: data.receivedDate,
          },
        });

        // Generate lot number if not provided
        const lotNumber = item.lotNumber || `LOT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

        // Create inventory lot
        await tx.inventoryLot.create({
          data: {
            lotNumber,
            productId: poItem.productId,
            quantity: item.receivedQuantity,
            unitCost: item.unitCost || poItem.unitPrice || undefined,
            supplierId: purchaseOrder.supplierId,
            locationId: item.locationId,
            receivedDate: data.receivedDate,
            purchaseOrderId: purchaseOrder.id,
            status: 'AVAILABLE',
            qualityStatus: 'APPROVED', // Default to approved, can be changed later
          },
        });
      }

      // Update purchase order status
      const allItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: data.purchaseOrderId },
      });

      const allReceived = allItems.every((item) => Number(item.receivedQuantity) >= Number(item.quantity));
      const anyReceived = allItems.some((item) => Number(item.receivedQuantity) > 0);

      let newStatus = purchaseOrder.status;
      if (allReceived) {
        newStatus = 'COMPLETED';
      } else if (anyReceived) {
        newStatus = 'PARTIAL';
      }

      const updatedOrder = await tx.purchaseOrder.update({
        where: { id: data.purchaseOrderId },
        data: { status: newStatus },
        include: {
          items: true,
          inventoryLots: true,
        },
      });

      return updatedOrder;
    });

    return result;
  }

  // ============================================
  // CONFIRMATION OPERATIONS
  // ============================================

  async createConfirmation(data: CreateConfirmationDTO) {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: data.purchaseOrderId },
    });

    if (!purchaseOrder) {
      throw new AppError('Purchase order not found', 404);
    }

    const confirmation = await prisma.purchaseOrderConfirmation.create({
      data: {
        purchaseOrderId: data.purchaseOrderId,
        confirmationDate: data.confirmationDate,
        confirmedBy: data.confirmedBy,
        isRevised: data.isRevised,
        revisionNotes: data.revisionNotes,
        status: data.status,
        documentUrl: data.documentUrl,
      },
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
      },
    });

    // Update purchase order status based on confirmation
    if (data.status === 'CONFIRMED') {
      await prisma.purchaseOrder.update({
        where: { id: data.purchaseOrderId },
        data: { status: 'CONFIRMED' },
      });
    } else if (data.status === 'REJECTED') {
      await prisma.purchaseOrder.update({
        where: { id: data.purchaseOrderId },
        data: { status: 'CANCELLED' },
      });
    }

    return confirmation;
  }

  async getConfirmations(purchaseOrderId?: string) {
    const where: Prisma.PurchaseOrderConfirmationWhereInput = {};

    if (purchaseOrderId) {
      where.purchaseOrderId = purchaseOrderId;
    }

    const confirmations = await prisma.purchaseOrderConfirmation.findMany({
      where,
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return confirmations;
  }

  // ============================================
  // REPORTS
  // ============================================

  async getStats(): Promise<PurchaseOrderStats> {
    const [
      total,
      byStatus,
      overdue,
      thisMonth,
    ] = await Promise.all([
      prisma.purchaseOrder.count(),
      prisma.purchaseOrder.groupBy({
        by: ['status'],
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      prisma.purchaseOrder.count({
        where: {
          status: { in: ['PENDING', 'CONFIRMED', 'PARTIAL'] },
          expectedDeliveryDate: { lt: new Date() },
        },
      }),
      prisma.purchaseOrder.aggregate({
        where: {
          orderDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
    ]);

    const statusMap = byStatus.reduce((acc, item) => {
      acc[item.status] = {
        count: item._count._all,
        totalAmount: Number(item._sum.totalAmount || 0),
      };
      return acc;
    }, {} as Record<string, { count: number; totalAmount: number }>);

    return {
      total,
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count._all,
        totalAmount: Number(item._sum.totalAmount || 0),
      })),
      pending: statusMap.PENDING?.count || 0,
      confirmed: statusMap.CONFIRMED?.count || 0,
      partial: statusMap.PARTIAL?.count || 0,
      completed: statusMap.COMPLETED?.count || 0,
      cancelled: statusMap.CANCELLED?.count || 0,
      overdueCount: overdue,
      thisMonthCount: thisMonth._count._all,
      thisMonthAmount: Number(thisMonth._sum.totalAmount || 0),
    };
  }

  async getSupplierHistory(supplierId: string): Promise<SupplierPurchaseHistory> {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    const orders = await prisma.purchaseOrder.findMany({
      where: { supplierId },
      include: {
        items: true,
        _count: { select: { items: true } },
      },
      orderBy: { orderDate: 'desc' },
    });

    const completedOrders = orders.filter((o) => o.status === 'COMPLETED');

    // Calculate average delivery time
    const deliveryTimes = completedOrders
      .filter((o) => o.expectedDeliveryDate)
      .map((o) => {
        const items = o.items.filter((i) => i.receivedDate);
        if (items.length === 0) return null;
        const avgReceivedDate = new Date(
          items.reduce((sum, i) => sum + (i.receivedDate?.getTime() || 0), 0) / items.length
        );
        return (avgReceivedDate.getTime() - o.expectedDeliveryDate!.getTime()) / (1000 * 60 * 60 * 24);
      })
      .filter((d) => d !== null) as number[];

    const avgDeliveryTime = deliveryTimes.length > 0
      ? deliveryTimes.reduce((sum, d) => sum + d, 0) / deliveryTimes.length
      : 0;

    // Calculate on-time delivery rate
    const onTimeDeliveries = deliveryTimes.filter((d) => d <= 0).length;
    const onTimeRate = deliveryTimes.length > 0
      ? (onTimeDeliveries / deliveryTimes.length) * 100
      : 0;

    return {
      supplier: {
        id: supplier.id,
        code: supplier.code,
        name: supplier.name,
      },
      totalOrders: orders.length,
      totalAmount: orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
      averageDeliveryTime: Math.round(avgDeliveryTime),
      onTimeDeliveryRate: Math.round(onTimeRate),
      recentOrders: orders.slice(0, 10).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        supplier: {
          id: supplier.id,
          code: supplier.code,
          name: supplier.name,
        },
        orderDate: o.orderDate,
        expectedDeliveryDate: o.expectedDeliveryDate,
        status: o.status,
        totalAmount: Number(o.totalAmount || 0),
        itemCount: o._count.items,
        receivedItemCount: o.items.filter((i) => Number(i.receivedQuantity) > 0).length,
        pendingItemCount: o.items.filter((i) => Number(i.receivedQuantity) < Number(i.quantity)).length,
      })),
    };
  }

  async getPendingReceiveReport(): Promise<PendingReceiveReport[]> {
    const pendingOrders = await prisma.purchaseOrder.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PARTIAL'] },
      },
      include: {
        supplier: true,
        items: {
          where: {
            receivedQuantity: { lt: prisma.purchaseOrderItem.fields.quantity },
          },
          include: {
            product: {
              include: {
                translations: {
                  where: { languageCode: 'tr' },
                },
              },
            },
          },
        },
      },
      orderBy: { expectedDeliveryDate: 'asc' },
    });

    const report = pendingOrders.map((order) => {
      const daysOverdue = order.expectedDeliveryDate
        ? Math.floor((new Date().getTime() - order.expectedDeliveryDate.getTime()) / (1000 * 60 * 60 * 24))
        : undefined;

      return {
        purchaseOrderId: order.id,
        orderNumber: order.orderNumber,
        supplier: order.supplier.name,
        expectedDate: order.expectedDeliveryDate,
        daysOverdue: daysOverdue && daysOverdue > 0 ? daysOverdue : undefined,
        items: order.items.map((item) => ({
          productCode: item.product.code,
          productName: item.product.translations[0]?.name || item.product.code,
          orderedQuantity: Number(item.quantity),
          receivedQuantity: Number(item.receivedQuantity),
          pendingQuantity: Number(item.quantity) - Number(item.receivedQuantity),
        })),
      };
    });

    return report;
  }
}

export default new PurchaseOrdersService();