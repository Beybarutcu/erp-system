import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import { validateUUID } from '@shared/middleware/validation';
import * as shippingController from './shipping.controller';

const router = Router();

router.use(authenticate);

// Get shipment statistics
router.get(
  '/stats',
  checkPermission('shipping', 'view'),
  shippingController.getShipmentStats
);

// Get all shipments
router.get(
  '/',
  checkPermission('shipping', 'view'),
  shippingController.getShipments
);

// Get shipment by ID
router.get(
  '/:id',
  checkPermission('shipping', 'view'),
  validateUUID('id'),
  shippingController.getShipmentById
);

// Create shipment
router.post(
  '/',
  checkPermission('shipping', 'create'),
  shippingController.createShipment
);

// Update shipment
router.put(
  '/:id',
  checkPermission('shipping', 'edit'),
  validateUUID('id'),
  shippingController.updateShipment
);

// Mark as shipped
router.post(
  '/:id/ship',
  checkPermission('shipping', 'edit'),
  validateUUID('id'),
  shippingController.markAsShipped
);

// Mark as delivered
router.post(
  '/:id/deliver',
  checkPermission('shipping', 'edit'),
  validateUUID('id'),
  shippingController.markAsDelivered
);

// Cancel shipment
router.post(
  '/:id/cancel',
  checkPermission('shipping', 'edit'),
  validateUUID('id'),
  shippingController.cancelShipment
);

export default router;