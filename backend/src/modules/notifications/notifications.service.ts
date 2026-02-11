import { prisma } from '@shared/database/client';
import { Prisma } from '@prisma/client';
import { AppError } from '@shared/middleware/error-handler';
import { WebSocketService } from '@shared/utils/websocket';
import { 
  PaginationParams, 
  PaginatedResponse 
} from '@shared/types';
import { createPaginatedResponse } from '@shared/utils/helpers';

export class NotificationsService {
  /**
   * Get all notifications for a user
   */
  async getNotifications(
    userId: string,
    params: PaginationParams & {
      isRead?: boolean;
      type?: string;
    }
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc', isRead, type } = params;

    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (isRead !== undefined) where.isRead = isRead;
    if (type) where.type = type;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return createPaginatedResponse(notifications, total, params);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Create notification
   */
  async createNotification(data: {
    userId: string;
    type: string;
    messageKey: string;
    messageParams?: any;
    severity?: string;
    referenceId?: string;
    referenceType?: string;
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        messageKey: data.messageKey,
        messageParams: data.messageParams || {},
        severity: data.severity || 'INFO',
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        isRead: false,
      },
    });

    // Send real-time notification via WebSocket
    WebSocketService.broadcast('notification:new', {
      id: notification.id,
      type: notification.type,
      messageKey: notification.messageKey,
      userId: notification.userId,
    });

    return notification;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    return await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { message: 'All notifications marked as read' };
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    await prisma.notification.delete({
      where: { id },
    });

    return { message: 'Notification deleted' };
  }

  /**
   * System notification - Send to all users
   */
  async createSystemNotification(data: {
    type: string;
    messageKey: string;
    messageParams?: any;
    severity?: string;
    roleFilter?: string[];
  }) {
    const where: Prisma.UserWhereInput = {};
    
    if (data.roleFilter && data.roleFilter.length > 0) {
      where.role = { in: data.roleFilter as any };
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    const notifications = await Promise.all(
      users.map(user =>
        prisma.notification.create({
          data: {
            userId: user.id,
            type: data.type,
            messageKey: data.messageKey,
            messageParams: data.messageParams || {},
            severity: data.severity || 'INFO',
            isRead: false,
          },
        })
      )
    );

    // Broadcast to all users
    WebSocketService.broadcast('notification:system', {
      type: data.type,
      messageKey: data.messageKey,
    });

    return {
      message: `System notification sent to ${users.length} users`,
      count: users.length,
    };
  }

  /**
   * Auto notifications for events
   */
  async notifyLowStock(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        translations: true,
        inventoryLots: {
          where: {
            status: 'ACTIVE',
            currentQuantity: { gt: 0 },
          },
        },
      },
    });

    if (!product) return;

    const totalStock = product.inventoryLots.reduce(
      (sum, lot) => sum + Number(lot.currentQuantity),
      0
    );

    const users = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MANAGER'] },
      },
    });

    const productName = product.translations?.[0]?.name || product.code;

    await Promise.all(
      users.map(user =>
        this.createNotification({
          userId: user.id,
          type: 'LOW_STOCK',
          messageKey: 'notifications.low_stock',
          messageParams: {
            productName,
            quantity: totalStock,
          },
          severity: 'WARNING',
          referenceId: productId,
          referenceType: 'PRODUCT',
        })
      )
    );
  }

  async notifyWorkOrderCompleted(workOrderId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        product: {
          include: {
            translations: true,
          },
        },
      },
    });

    if (!workOrder) return;

    const users = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MANAGER'] },
      },
    });

    const productName = workOrder.product.translations?.[0]?.name || workOrder.product.code;

    await Promise.all(
      users.map(user =>
        this.createNotification({
          userId: user.id,
          type: 'WORK_ORDER_COMPLETED',
          messageKey: 'notifications.work_order_completed',
          messageParams: {
            woNumber: workOrder.woNumber,
            productName,
            quantity: Number(workOrder.producedQuantity || 0),
          },
          severity: 'INFO',
          referenceId: workOrderId,
          referenceType: 'WORK_ORDER',
        })
      )
    );
  }

  async notifyOrderCreated(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
      },
    });

    if (!order) return;

    const users = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MANAGER'] },
      },
    });

    await Promise.all(
      users.map(user =>
        this.createNotification({
          userId: user.id,
          type: 'ORDER_CREATED',
          messageKey: 'notifications.order_created',
          messageParams: {
            customerName: order.customer.name,
            orderNumber: order.orderNumber,
          },
          severity: 'INFO',
          referenceId: orderId,
          referenceType: 'ORDER',
        })
      )
    );
  }
}

export default new NotificationsService();