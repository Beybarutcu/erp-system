import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import { validateBody, validateUUID } from '@shared/middleware/validation';
import { createCustomerSchema, updateCustomerSchema } from '@shared/validators/schemas';
import * as customersController from './customers.controller';

const router = Router();

router.use(authenticate);

// Search customers
router.get(
  '/search',
  checkPermission('customers', 'view'),
  customersController.searchCustomers
);

// Get all customers
router.get(
  '/',
  checkPermission('customers', 'view'),
  customersController.getCustomers
);

// Get customer by ID
router.get(
  '/:id',
  checkPermission('customers', 'view'),
  validateUUID('id'),
  customersController.getCustomerById
);

// Get customer statistics
router.get(
  '/:id/stats',
  checkPermission('customers', 'view'),
  validateUUID('id'),
  customersController.getCustomerStats
);

// Create customer
router.post(
  '/',
  checkPermission('customers', 'create'),
  validateBody(createCustomerSchema),
  customersController.createCustomer
);

// Update customer
router.put(
  '/:id',
  checkPermission('customers', 'edit'),
  validateUUID('id'),
  validateBody(updateCustomerSchema),
  customersController.updateCustomer
);

// Delete customer
router.delete(
  '/:id',
  checkPermission('customers', 'delete'),
  validateUUID('id'),
  customersController.deleteCustomer
);

export default router;