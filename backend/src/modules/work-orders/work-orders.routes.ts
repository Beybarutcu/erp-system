import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import { validateBody, validateUUID } from '@shared/middleware/validation';
import { 
  createWorkOrderSchema,
  updateWorkOrderSchema,
  recordProductionSchema,
  startWorkOrderSchema 
} from '@shared/validators/schemas';
import * as workOrdersController from './work-orders.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all work orders
router.get(
  '/',
  checkPermission('work_orders', 'view'),
  workOrdersController.getWorkOrders
);

// Get work order by ID
router.get(
  '/:id',
  checkPermission('work_orders', 'view'),
  validateUUID('id'),
  workOrdersController.getWorkOrderById
);

// Get work order timeline
router.get(
  '/:id/timeline',
  checkPermission('work_orders', 'view'),
  validateUUID('id'),
  workOrdersController.getWorkOrderTimeline
);

// Get material usage
router.get(
  '/:id/material-usage',
  checkPermission('work_orders', 'view'),
  validateUUID('id'),
  workOrdersController.getMaterialUsage
);

// Create work order
router.post(
  '/',
  checkPermission('work_orders', 'create'),
  validateBody(createWorkOrderSchema),
  workOrdersController.createWorkOrder
);

// Start work order
router.post(
  '/:id/start',
  checkPermission('work_orders', 'edit'),
  validateUUID('id'),
  validateBody(startWorkOrderSchema),
  workOrdersController.startWorkOrder
);

// Record production
router.post(
  '/:id/record-production',
  checkPermission('work_orders', 'edit'),
  validateUUID('id'),
  validateBody(recordProductionSchema),
  workOrdersController.recordProduction
);

// Pause work order
router.post(
  '/:id/pause',
  checkPermission('work_orders', 'edit'),
  validateUUID('id'),
  workOrdersController.pauseWorkOrder
);

// Resume work order
router.post(
  '/:id/resume',
  checkPermission('work_orders', 'edit'),
  validateUUID('id'),
  workOrdersController.resumeWorkOrder
);

// Complete work order
router.post(
  '/:id/complete',
  checkPermission('work_orders', 'edit'),
  validateUUID('id'),
  workOrdersController.completeWorkOrder
);

// Cancel work order
router.post(
  '/:id/cancel',
  checkPermission('work_orders', 'edit'),
  validateUUID('id'),
  workOrdersController.cancelWorkOrder
);

export default router;
