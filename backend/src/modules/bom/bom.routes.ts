import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import * as bomController from './bom.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get BOM for a product
router.get(
  '/products/:productId/bom',
  checkPermission('bom', 'view'),
  bomController.getProductBOM
);

// Get BOM tree (recursive)
router.get(
  '/products/:productId/bom/tree',
  checkPermission('bom', 'view'),
  bomController.getBOMTree
);

// Explode BOM (calculate all materials needed)
router.post(
  '/products/:productId/bom/explode',
  checkPermission('bom', 'view'),
  bomController.explodeBOM
);

// Create BOM item
router.post(
  '/products/:productId/bom',
  checkPermission('bom', 'create'),
  bomController.createBOMItem
);

// Update BOM item
router.put(
  '/:bomItemId',
  checkPermission('bom', 'edit'),
  bomController.updateBOMItem
);

// Delete BOM item
router.delete(
  '/:bomItemId',
  checkPermission('bom', 'delete'),
  bomController.deleteBOMItem
);

// Copy BOM from another product
router.post(
  '/products/:productId/bom/copy',
  checkPermission('bom', 'create'),
  bomController.copyBOM
);

// Generate work orders from BOM
router.post(
  '/products/:productId/bom/generate-work-orders',
  checkPermission('work_orders', 'create'),
  bomController.generateWorkOrders
);

export default router;
