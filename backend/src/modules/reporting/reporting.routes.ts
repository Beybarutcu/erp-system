import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import * as reportingController from './reporting.controller';

const router = Router();

router.use(authenticate);

// Production Report
router.get(
  '/production',
  checkPermission('reporting', 'view'),
  reportingController.getProductionReport
);

// Inventory Report
router.get(
  '/inventory',
  checkPermission('reporting', 'view'),
  reportingController.getInventoryReport
);

// Sales Report
router.get(
  '/sales',
  checkPermission('reporting', 'view'),
  reportingController.getSalesReport
);

// Material Consumption Report
router.get(
  '/material-consumption',
  checkPermission('reporting', 'view'),
  reportingController.getMaterialConsumptionReport
);

// Machine Utilization Report
router.get(
  '/machine-utilization',
  checkPermission('reporting', 'view'),
  reportingController.getMachineUtilizationReport
);

// Financial Summary Report
router.get(
  '/financial-summary',
  checkPermission('reporting', 'view'),
  reportingController.getFinancialSummaryReport
);

export default router;