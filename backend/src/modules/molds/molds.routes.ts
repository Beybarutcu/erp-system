// ============================================
// MOLD TRACKING ROUTES
// backend/src/modules/molds/molds.routes.ts
// ============================================

import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import { validateUUID } from '@shared/middleware/validation';
import * as moldsController from './molds.controller';

const router = Router();

router.use(authenticate);

// CRUD
router.get('/', checkPermission('molds', 'view'), moldsController.getMolds);
router.get('/:id', checkPermission('molds', 'view'), validateUUID('id'), moldsController.getMoldById);
router.post('/', checkPermission('molds', 'create'), moldsController.createMold);
router.put('/:id', checkPermission('molds', 'edit'), validateUUID('id'), moldsController.updateMold);
router.delete('/:id', checkPermission('molds', 'delete'), validateUUID('id'), moldsController.deleteMold);

// Maintenance
router.post('/maintenance', checkPermission('molds', 'edit'), moldsController.createMaintenance);
router.get('/maintenance/history', checkPermission('molds', 'view'), moldsController.getMaintenanceHistory);
router.get('/maintenance/schedule', checkPermission('molds', 'view'), moldsController.getMaintenanceSchedule);

// Usage
router.post('/usage', checkPermission('molds', 'edit'), moldsController.recordUsage);
router.get('/usage/history', checkPermission('molds', 'view'), moldsController.getUsageHistory);

// Reports
router.get('/reports/stats', checkPermission('molds', 'view'), moldsController.getStats);
router.get('/reports/utilization/:moldId', checkPermission('molds', 'view'), validateUUID('moldId'), moldsController.getMoldUtilization);

export default router;


