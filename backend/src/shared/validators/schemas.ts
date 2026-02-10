import { z } from 'zod';

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const updateProfileSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  languagePreference: z.enum(['tr', 'en']).optional(),
});

// ============================================
// PRODUCT SCHEMAS
// ============================================

export const createProductSchema = z.object({
  code: z.string().min(1).max(50),
  type: z.enum(['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED', 'MOLD', 'OUTSOURCED']),
  isStocked: z.boolean().default(true),
  translations: z.array(z.object({
    languageCode: z.enum(['tr', 'en']),
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    technicalSpecs: z.record(z.any()).optional(),
  })).min(1, 'At least one translation required'),
});

export const updateProductSchema = createProductSchema.partial();

// ============================================
// BOM SCHEMAS
// ============================================

export const createBOMItemSchema = z.object({
  childProductId: z.string().uuid(),
  sequenceOrder: z.number().int().positive(),
  quantity: z.number().positive(),
  operationType: z.string().optional(),
  machineType: z.string().optional(),
  cycleTimeSeconds: z.number().int().positive().optional(),
  setupTimeMinutes: z.number().int().positive().optional(),
  scrapRate: z.number().min(0).max(100).default(0),
  level: z.number().int().min(0).default(0),
  translations: z.array(z.object({
    languageCode: z.enum(['tr', 'en']),
    operationName: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
});

export const explodeBOMSchema = z.object({
  quantity: z.number().positive(),
});

export const copyBOMSchema = z.object({
  sourceProductId: z.string().uuid(),
});

export const generateWorkOrdersSchema = z.object({
  quantity: z.number().positive(),
  orderId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
});

// ============================================
// INVENTORY SCHEMAS
// ============================================

export const createLotSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  locationCode: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  workOrderId: z.string().uuid().optional(),
  unitCost: z.number().positive().optional(),
  expiryDate: z.string().datetime().optional(),
});

export const updateLotSchema = z.object({
  status: z.enum(['ACTIVE', 'BLOCKED', 'OUTSOURCED', 'SCRAP']).optional(),
  locationCode: z.string().optional(),
});

export const allocateStockSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  workOrderId: z.string().uuid().optional(),
});

export const consumeStockSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  workOrderId: z.string().uuid().optional(),
  manualLotId: z.string().uuid().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // If manual lot is selected, notes are required
  if (data.manualLotId && !data.notes) {
    return false;
  }
  return true;
}, {
  message: 'Notes are required when manually selecting a lot',
  path: ['notes'],
});

export const adjustStockSchema = z.object({
  lotId: z.string().uuid(),
  newQuantity: z.number().min(0),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

// ============================================
// WORK ORDER SCHEMAS
// ============================================

export const createWorkOrderSchema = z.object({
  productId: z.string().uuid(),
  bomItemId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  plannedQuantity: z.number().positive(),
  machineId: z.string().uuid().optional(),
  plannedStartDate: z.string().datetime().optional(),
  plannedEndDate: z.string().datetime().optional(),
  priority: z.number().int().min(1).max(10).default(5),
  isOutsourced: z.boolean().default(false),
  outsourceSupplierId: z.string().uuid().optional(),
});

export const updateWorkOrderSchema = createWorkOrderSchema.partial();

export const recordProductionSchema = z.object({
  quantityProduced: z.number().positive(),
  quantityScrap: z.number().min(0).default(0),
  operatorId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const startWorkOrderSchema = z.object({
  machineId: z.string().uuid().optional(),
  operatorId: z.string().uuid().optional(),
});

// ============================================
// MACHINE SCHEMAS
// ============================================

export const createMachineSchema = z.object({
  code: z.string().min(1).max(50),
  machineType: z.string().min(1),
  capacityPerHour: z.number().positive().optional(),
  location: z.string().optional(),
  translations: z.array(z.object({
    languageCode: z.enum(['tr', 'en']),
    name: z.string().min(1).max(255),
    description: z.string().optional(),
  })).min(1),
});

export const updateMachineSchema = createMachineSchema.partial();

export const scheduleMaintenance Schema = z.object({
  maintenanceType: z.enum(['PREVENTIVE', 'BREAKDOWN']),
  scheduledDate: z.string().datetime(),
  durationHours: z.number().int().positive(),
  notes: z.string().optional(),
});

// ============================================
// ORDER SCHEMAS
// ============================================

export const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  orderDate: z.string().datetime(),
  deliveryDate: z.string().datetime().optional(),
  currency: z.string().length(3).default('TRY'),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive().optional(),
    notes: z.string().optional(),
  })).min(1, 'At least one order item required'),
});

export const updateOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  orderDate: z.string().datetime().optional(),
  deliveryDate: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
});

// ============================================
// CUSTOMER SCHEMAS
// ============================================

export const createCustomerSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  paymentTerms: z.number().int().min(0).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ============================================
// SUPPLIER SCHEMAS
// ============================================

export const createSupplierSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  type: z.enum(['MATERIAL', 'OUTSOURCING', 'BOTH']),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  leadTimeDays: z.number().int().min(0).optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

// ============================================
// QUERY SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).default('50'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

// ============================================
// EXPORT TYPES
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateBOMItemInput = z.infer<typeof createBOMItemSchema>;
export type ExplodeBOMInput = z.infer<typeof explodeBOMSchema>;
export type CreateLotInput = z.infer<typeof createLotSchema>;
export type ConsumeStockInput = z.infer<typeof consumeStockSchema>;
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
