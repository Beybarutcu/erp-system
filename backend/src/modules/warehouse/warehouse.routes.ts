// ============================================
// WAREHOUSE ROUTES
// backend/src/modules/warehouse/warehouse.routes.ts
// ============================================

import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import { validateUUID } from '@shared/middleware/validation';
import * as warehouseController from './warehouse.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// WAREHOUSES
// ============================================

// Get all warehouses
router.get(
  '/',
  checkPermission('warehouse', 'view'),
  warehouseController.getWarehouses
);

// Get warehouse by ID
router.get(
  '/:id',
  checkPermission('warehouse', 'view'),
  validateUUID('id'),
  warehouseController.getWarehouseById
);

// Create warehouse
router.post(
  '/',
  checkPermission('warehouse', 'create'),
  warehouseController.createWarehouse
);

// Update warehouse
router.put(
  '/:id',
  checkPermission('warehouse', 'edit'),
  validateUUID('id'),
  warehouseController.updateWarehouse
);

// Delete warehouse
router.delete(
  '/:id',
  checkPermission('warehouse', 'delete'),
  validateUUID('id'),
  warehouseController.deleteWarehouse
);

// ============================================
// ZONES
// ============================================

// Get zones
router.get(
  '/zones/list',
  checkPermission('warehouse', 'view'),
  warehouseController.getZones
);

// Create zone
router.post(
  '/zones',
  checkPermission('warehouse', 'create'),
  warehouseController.createZone
);

// ============================================
// LOCATIONS
// ============================================

// Get locations
router.get(
  '/locations/list',
  checkPermission('warehouse', 'view'),
  warehouseController.getLocations
);

// Get location by ID
router.get(
  '/locations/:id',
  checkPermission('warehouse', 'view'),
  validateUUID('id'),
  warehouseController.getLocationById
);

// Create location
router.post(
  '/locations',
  checkPermission('warehouse', 'create'),
  warehouseController.createLocation
);

// Update location
router.put(
  '/locations/:id',
  checkPermission('warehouse', 'edit'),
  validateUUID('id'),
  warehouseController.updateLocation
);

// ============================================
// TRANSFERS
// ============================================

// Transfer lot between locations
router.post(
  '/transfer',
  checkPermission('warehouse', 'edit'),
  warehouseController.transferLot
);

// Get transfer history
router.get(
  '/transfers/history',
  checkPermission('warehouse', 'view'),
  warehouseController.getTransfers
);

// ============================================
// REPORTS
// ============================================

// Get warehouse occupancy report
router.get(
  '/:warehouseId/occupancy',
  checkPermission('warehouse', 'view'),
  validateUUID('warehouseId'),
  warehouseController.getOccupancyReport
);

// Get available locations
router.get(
  '/:warehouseId/available',
  checkPermission('warehouse', 'view'),
  validateUUID('warehouseId'),
  warehouseController.getAvailableLocations
);

export default router;