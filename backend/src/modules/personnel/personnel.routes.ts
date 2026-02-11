// ============================================
// ROUTES - personnel.routes.ts
// ============================================

import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import { validateUUID } from '@shared/middleware/validation';
import * as personnelController from './personnel.controller';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('personnel', 'view'), personnelController.getPersonnel);
router.get('/:id', checkPermission('personnel', 'view'), validateUUID('id'), personnelController.getPersonnelById);
router.post('/', checkPermission('personnel', 'create'), personnelController.createPersonnel);
router.put('/:id', checkPermission('personnel', 'edit'), validateUUID('id'), personnelController.updatePersonnel);
router.delete('/:id', checkPermission('personnel', 'delete'), validateUUID('id'), personnelController.deletePersonnel);

router.post('/capacity', checkPermission('personnel', 'edit'), personnelController.recordCapacity);
router.get('/capacity/report', checkPermission('personnel', 'view'), personnelController.getCapacityReport);

router.get('/reports/stats', checkPermission('personnel', 'view'), personnelController.getStats);

export default router;