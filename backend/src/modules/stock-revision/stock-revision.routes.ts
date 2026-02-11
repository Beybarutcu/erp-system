// ============================================
// ROUTES - stock-revision.routes.ts
// ============================================

import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import { validateUUID } from '@shared/middleware/validation';
import * as stockRevisionController from './stock-revision.controller';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('inventory', 'view'), stockRevisionController.getRevisions);
router.post('/', checkPermission('inventory', 'edit'), stockRevisionController.createRevision);
router.post('/:id/approve', checkPermission('inventory', 'edit'), validateUUID('id'), stockRevisionController.approveRevision);
router.post('/:id/reject', checkPermission('inventory', 'edit'), validateUUID('id'), stockRevisionController.rejectRevision);
router.get('/stats', checkPermission('inventory', 'view'), stockRevisionController.getStats);

export default router;


