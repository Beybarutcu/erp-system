// ============================================
// ROUTES - samples.routes.ts
// ============================================

import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import { validateUUID } from '@shared/middleware/validation';
import * as samplesController from './samples.controller';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('samples', 'view'), samplesController.getSamples);
router.get('/:id', checkPermission('samples', 'view'), validateUUID('id'), samplesController.getSampleById);
router.post('/', checkPermission('samples', 'create'), samplesController.createSample);
router.put('/:id', checkPermission('samples', 'edit'), validateUUID('id'), samplesController.updateSample);

router.post('/production', checkPermission('samples', 'edit'), samplesController.recordProduction);
router.post('/:id/send', checkPermission('samples', 'edit'), validateUUID('id'), samplesController.markAsSent);
router.post('/approval', checkPermission('samples', 'edit'), samplesController.recordApproval);

router.get('/reports/stats', checkPermission('samples', 'view'), samplesController.getStats);

export default router;


