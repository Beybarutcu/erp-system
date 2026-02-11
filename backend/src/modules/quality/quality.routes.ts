// ============================================
// QUALITY CONTROL ROUTES
// backend/src/modules/quality/quality.routes.ts
// ============================================

import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import { validateUUID } from '@shared/middleware/validation';
import * as qualityController from './quality.controller';

const router = Router();

router.use(authenticate);

// Measurements
router.get('/measurements', checkPermission('quality', 'view'), qualityController.getQualityMeasurements);
router.get('/measurements/:id', checkPermission('quality', 'view'), validateUUID('id'), qualityController.getMeasurementById);
router.post('/measurements', checkPermission('quality', 'create'), qualityController.createQualityMeasurement);
router.put('/measurements/:id', checkPermission('quality', 'edit'), validateUUID('id'), qualityController.updateQualityMeasurement);

// Inspections
router.get('/inspections', checkPermission('quality', 'view'), qualityController.getFinalInspections);
router.get('/inspections/:id', checkPermission('quality', 'view'), validateUUID('id'), qualityController.getInspectionById);
router.post('/inspections', checkPermission('quality', 'create'), qualityController.createFinalInspection);
router.put('/inspections/:id', checkPermission('quality', 'edit'), validateUUID('id'), qualityController.updateFinalInspection);

// Defects
router.get('/defects', checkPermission('quality', 'view'), qualityController.getDefects);

// Reports
router.get('/reports/stats', checkPermission('quality', 'view'), qualityController.getQualityStats);
router.get('/reports/defect-analysis', checkPermission('quality', 'view'), qualityController.getDefectAnalysis);

export default router;


