import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import { validateBody, validateUUID } from '@shared/middleware/validation';
import { 
  createMachineSchema, 
  updateMachineSchema,
  scheduleMaintenanceSchema 
} from '@shared/validators/schemas';
import * as machinesController from './machines.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all machines
router.get(
  '/',
  checkPermission('machines', 'view'),
  machinesController.getMachines
);

// Get utilization overview
router.get(
  '/utilization/overview',
  checkPermission('machines', 'view'),
  machinesController.getUtilizationOverview
);

// Get machine types summary
router.get(
  '/summary/types',
  checkPermission('machines', 'view'),
  machinesController.getMachineTypesSummary
);

// Get machine by ID
router.get(
  '/:id',
  checkPermission('machines', 'view'),
  validateUUID('id'),
  machinesController.getMachineById
);

// Get machine schedule
router.get(
  '/:id/schedule',
  checkPermission('machines', 'view'),
  validateUUID('id'),
  machinesController.getMachineSchedule
);

// Get machine utilization
router.get(
  '/:id/utilization',
  checkPermission('machines', 'view'),
  validateUUID('id'),
  machinesController.getMachineUtilization
);

// Get machine performance
router.get(
  '/:id/performance',
  checkPermission('machines', 'view'),
  validateUUID('id'),
  machinesController.getMachinePerformance
);

// Create machine
router.post(
  '/',
  checkPermission('machines', 'create'),
  validateBody(createMachineSchema),
  machinesController.createMachine
);

// Schedule maintenance
router.post(
  '/:id/maintenance',
  checkPermission('machines', 'edit'),
  validateUUID('id'),
  validateBody(scheduleMaintenanceSchema),
  machinesController.scheduleMaintenance
);

// Update shifts
router.post(
  '/:id/shifts',
  checkPermission('machines', 'edit'),
  validateUUID('id'),
  machinesController.updateShifts
);

// Update machine
router.put(
  '/:id',
  checkPermission('machines', 'edit'),
  validateUUID('id'),
  validateBody(updateMachineSchema),
  machinesController.updateMachine
);

// Complete maintenance
router.put(
  '/maintenance/:maintenanceId/complete',
  checkPermission('machines', 'edit'),
  validateUUID('maintenanceId'),
  machinesController.completeMaintenance
);

// Delete machine
router.delete(
  '/:id',
  checkPermission('machines', 'delete'),
  validateUUID('id'),
  machinesController.deleteMachine
);

export default router;
