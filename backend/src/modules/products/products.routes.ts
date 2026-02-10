import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import { validateBody, validateParams, validateUUID } from '@shared/middleware/validation';
import { createProductSchema, updateProductSchema, uuidParamSchema } from '@shared/validators/schemas';
import * as productsController from './products.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all products
router.get(
  '/',
  checkPermission('products', 'view'),
  productsController.getProducts
);

// Search products
router.get(
  '/search',
  checkPermission('products', 'view'),
  productsController.searchProducts
);

// Get products summary by type
router.get(
  '/summary/types',
  checkPermission('products', 'view'),
  productsController.getProductTypesSummary
);

// Get products by type
router.get(
  '/type/:type',
  checkPermission('products', 'view'),
  productsController.getProductsByType
);

// Get product by ID
router.get(
  '/:id',
  checkPermission('products', 'view'),
  validateUUID('id'),
  productsController.getProductById
);

// Get product stock
router.get(
  '/:id/stock',
  checkPermission('products', 'view'),
  validateUUID('id'),
  productsController.getProductStock
);

// Get product usage
router.get(
  '/:id/usage',
  checkPermission('products', 'view'),
  validateUUID('id'),
  productsController.getProductUsage
);

// Create product
router.post(
  '/',
  checkPermission('products', 'create'),
  validateBody(createProductSchema),
  productsController.createProduct
);

// Bulk import products
router.post(
  '/bulk-import',
  checkPermission('products', 'create'),
  productsController.bulkImportProducts
);

// Update product
router.put(
  '/:id',
  checkPermission('products', 'edit'),
  validateUUID('id'),
  validateBody(updateProductSchema),
  productsController.updateProduct
);

// Delete product
router.delete(
  '/:id',
  checkPermission('products', 'delete'),
  validateUUID('id'),
  productsController.deleteProduct
);

export default router;
