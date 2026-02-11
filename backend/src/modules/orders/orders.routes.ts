import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import { validateBody, validateUUID } from '@shared/middleware/validation';
import { createOrderSchema, updateOrderSchema } from '@shared/validators/schemas';
import * as ordersController from './orders.controller';

const router = Router();

router.use(authenticate);

// Get order statistics
router.get(
  '/stats',
  checkPermission('orders', 'view'),
  ordersController.getOrderStats
);

// Get all orders
router.get(
  '/',
  checkPermission('orders', 'view'),
  ordersController.getOrders
);

// Get order by ID
router.get(
  '/:id',
  checkPermission('orders', 'view'),
  validateUUID('id'),
  ordersController.getOrderById
);

// Create order
router.post(
  '/',
  checkPermission('orders', 'create'),
  validateBody(createOrderSchema),
  ordersController.createOrder
);

// Add item to order
router.post(
  '/:orderId/items',
  checkPermission('orders', 'edit'),
  validateUUID('orderId'),
  ordersController.addOrderItem
);

// Update order
router.put(
  '/:id',
  checkPermission('orders', 'edit'),
  validateUUID('id'),
  validateBody(updateOrderSchema),
  ordersController.updateOrder
);

// Cancel order
router.post(
  '/:id/cancel',
  checkPermission('orders', 'edit'),
  validateUUID('id'),
  ordersController.cancelOrder
);

// Update order item
router.put(
  '/items/:itemId',
  checkPermission('orders', 'edit'),
  validateUUID('itemId'),
  ordersController.updateOrderItem
);

// Delete order item
router.delete(
  '/items/:itemId',
  checkPermission('orders', 'edit'),
  validateUUID('itemId'),
  ordersController.deleteOrderItem
);

export default router;