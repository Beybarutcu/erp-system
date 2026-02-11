// ============================================
// PURCHASE ORDERS ROUTES
// backend/src/modules/purchase-orders/purchase-orders.routes.ts
// ============================================

import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import { validateUUID } from '@shared/middleware/validation';
import * as purchaseOrdersController from './purchase-orders.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// CRUD OPERATIONS
// ============================================

// Get all purchase orders
router.get(
  '/',
  checkPermission('purchase_orders', 'view'),
  purchaseOrdersController.getPurchaseOrders
);

// Get purchase order by ID
router.get(
  '/:id',
  checkPermission('purchase_orders', 'view'),
  validateUUID('id'),
  purchaseOrdersController.getPurchaseOrderById
);

// Create purchase order
router.post(
  '/',
  checkPermission('purchase_orders', 'create'),
  purchaseOrdersController.createPurchaseOrder
);

// Update purchase order
router.put(
  '/:id',
  checkPermission('purchase_orders', 'edit'),
  validateUUID('id'),
  purchaseOrdersController.updatePurchaseOrder
);

// Delete purchase order
router.delete(
  '/:id',
  checkPermission('purchase_orders', 'delete'),
  validateUUID('id'),
  purchaseOrdersController.deletePurchaseOrder
);

// ============================================
// RECEIVE OPERATIONS
// ============================================

// Receive purchase order (create inventory lots)
router.post(
  '/receive',
  checkPermission('purchase_orders', 'edit'),
  purchaseOrdersController.receivePurchaseOrder
);

// ============================================
// CONFIRMATIONS
// ============================================

// Get confirmations
router.get(
  '/confirmations/list',
  checkPermission('purchase_orders', 'view'),
  purchaseOrdersController.getConfirmations
);

// Create confirmation
router.post(
  '/confirmations',
  checkPermission('purchase_orders', 'edit'),
  purchaseOrdersController.createConfirmation
);

// ============================================
// REPORTS
// ============================================

// Get purchase order statistics
router.get(
  '/reports/stats',
  checkPermission('purchase_orders', 'view'),
  purchaseOrdersController.getStats
);

// Get supplier purchase history
router.get(
  '/reports/supplier/:supplierId',
  checkPermission('purchase_orders', 'view'),
  validateUUID('supplierId'),
  purchaseOrdersController.getSupplierHistory
);

// Get pending receive report
router.get(
  '/reports/pending-receive',
  checkPermission('purchase_orders', 'view'),
  purchaseOrdersController.getPendingReceiveReport
);

export default router;