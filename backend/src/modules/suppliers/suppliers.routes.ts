import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import { validateBody, validateUUID } from '@shared/middleware/validation';
import { createSupplierSchema, updateSupplierSchema } from '@shared/validators/schemas';
import * as suppliersController from './suppliers.controller';

const router = Router();

router.use(authenticate);

// Search suppliers
router.get(
  '/search',
  checkPermission('suppliers', 'view'),
  suppliersController.searchSuppliers
);

// Get suppliers by type
router.get(
  '/type/:type',
  checkPermission('suppliers', 'view'),
  suppliersController.getSuppliersByType
);

// Get all suppliers
router.get(
  '/',
  checkPermission('suppliers', 'view'),
  suppliersController.getSuppliers
);

// Get supplier by ID
router.get(
  '/:id',
  checkPermission('suppliers', 'view'),
  validateUUID('id'),
  suppliersController.getSupplierById
);

// Get supplier statistics
router.get(
  '/:id/stats',
  checkPermission('suppliers', 'view'),
  validateUUID('id'),
  suppliersController.getSupplierStats
);

// Create supplier
router.post(
  '/',
  checkPermission('suppliers', 'create'),
  validateBody(createSupplierSchema),
  suppliersController.createSupplier
);

// Update supplier
router.put(
  '/:id',
  checkPermission('suppliers', 'edit'),
  validateUUID('id'),
  validateBody(updateSupplierSchema),
  suppliersController.updateSupplier
);

// Delete supplier
router.delete(
  '/:id',
  checkPermission('suppliers', 'delete'),
  validateUUID('id'),
  suppliersController.deleteSupplier
);

export default router;