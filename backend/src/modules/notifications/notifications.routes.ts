import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import { validateUUID } from '@shared/middleware/validation';
import * as notificationsController from './notifications.controller';

const router = Router();

router.use(authenticate);

// Get unread count
router.get(
  '/unread-count',
  notificationsController.getUnreadCount
);

// Get all notifications
router.get(
  '/',
  notificationsController.getNotifications
);

// Mark all as read
router.post(
  '/mark-all-read',
  notificationsController.markAllAsRead
);

// Mark as read
router.put(
  '/:id/read',
  validateUUID('id'),
  notificationsController.markAsRead
);

// Delete notification
router.delete(
  '/:id',
  validateUUID('id'),
  notificationsController.deleteNotification
);

// Create system notification (admin only)
router.post(
  '/system',
  checkPermission('notifications', 'create'),
  notificationsController.createSystemNotification
);

export default router;