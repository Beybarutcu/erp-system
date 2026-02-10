import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import * as inventoryController from './inventory.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Lots management
router.get(
  '/lots',
  checkPermission('inventory', 'view'),
  inventoryController.getLots
);

router.get(
  '/lots/:lotId',
  checkPermission('inventory', 'view'),
  inventoryController.getLotById
);

router.post(
  '/lots',
  checkPermission('inventory', 'create'),
  inventoryController.createLot
);

router.put(
  '/lots/:lotId',
  checkPermission('inventory', 'edit'),
  inventoryController.updateLot
);

// Stock operations
router.get(
  '/available',
  checkPermission('inventory', 'view'),
  inventoryController.getAvailableStock
);

router.get(
  '/aging',
  checkPermission('inventory', 'view'),
  inventoryController.getAgingStock
);

router.post(
  '/allocate',
  checkPermission('inventory', 'edit'),
  inventoryController.allocateStock
);

router.post(
  '/consume',
  checkPermission('inventory', 'edit'),
  inventoryController.consumeStock
);

router.post(
  '/adjust',
  checkPermission('inventory', 'edit'),
  inventoryController.adjustStock
);

// Transactions
router.get(
  '/transactions',
  checkPermission('inventory', 'view'),
  inventoryController.getTransactions
);

// Reports
router.get(
  '/valuation',
  checkPermission('inventory', 'view'),
  inventoryController.getInventoryValuation
);

router.get(
  '/movement',
  checkPermission('inventory', 'view'),
  inventoryController.getInventoryMovement
);

export default router;
