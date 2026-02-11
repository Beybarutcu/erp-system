import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import { validateUUID } from '@shared/middleware/validation';
import * as outsourcingController from './outsourcing.controller';

const router = Router();

router.use(authenticate);

// Get outsourcing statistics
router.get(
  '/stats',
  checkPermission('outsourcing', 'view'),
  outsourcingController.getOutsourcingStats
);

// Get all outsourcing jobs
router.get(
  '/',
  checkPermission('outsourcing', 'view'),
  outsourcingController.getOutsourcingJobs
);

// Get jobs by supplier
router.get(
  '/supplier/:supplierId',
  checkPermission('outsourcing', 'view'),
  validateUUID('supplierId'),
  outsourcingController.getJobsBySupplier
);

// Get outsourcing job by ID
router.get(
  '/:id',
  checkPermission('outsourcing', 'view'),
  validateUUID('id'),
  outsourcingController.getOutsourcingJobById
);

// Create outsourcing job
router.post(
  '/',
  checkPermission('outsourcing', 'create'),
  outsourcingController.createOutsourcingJob
);

// Update outsourcing job
router.put(
  '/:id',
  checkPermission('outsourcing', 'edit'),
  validateUUID('id'),
  outsourcingController.updateOutsourcingJob
);

// Start job
router.post(
  '/:id/start',
  checkPermission('outsourcing', 'edit'),
  validateUUID('id'),
  outsourcingController.startJob
);

// Complete job
router.post(
  '/:id/complete',
  checkPermission('outsourcing', 'edit'),
  validateUUID('id'),
  outsourcingController.completeJob
);

// Cancel job
router.post(
  '/:id/cancel',
  checkPermission('outsourcing', 'edit'),
  validateUUID('id'),
  outsourcingController.cancelJob
);

export default router;