// ============================================
// PURCHASE ORDERS TYPES
// backend/src/modules/purchase-orders/purchase-orders.types.ts
// ============================================

import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderConfirmation,
  PurchaseOrderStatus,
  Supplier,
  Product,
  InventoryLot,
} from '@prisma/client';

// ============================================
// BASE TYPES
// ============================================

export interface PurchaseOrderWithDetails extends PurchaseOrder {
  supplier: Supplier;
  items: PurchaseOrderItemWithProduct[];
  confirmations: PurchaseOrderConfirmation[];
  inventoryLots: InventoryLot[];
  _count: {
    items: number;
    confirmations: number;
    inventoryLots: number;
  };
}

export interface PurchaseOrderItemWithProduct extends PurchaseOrderItem {
  product: Product & {
    translations: Array<{
      languageCode: string;
      name: string;
    }>;
  };
}

export interface PurchaseOrderConfirmationWithOrder extends PurchaseOrderConfirmation {
  purchaseOrder: PurchaseOrder & {
    supplier: Supplier;
  };
}

// ============================================
// DTO TYPES
// ============================================

export interface CreatePurchaseOrderDTO {
  supplierId: string;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  paymentTerms?: string;
  notes?: string;
  items: CreatePurchaseOrderItemDTO[];
}

export interface CreatePurchaseOrderItemDTO {
  productId: string;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}

export interface UpdatePurchaseOrderDTO {
  expectedDeliveryDate?: Date;
  status?: PurchaseOrderStatus;
  paymentTerms?: string;
  notes?: string;
}

export interface UpdatePurchaseOrderItemDTO {
  quantity?: number;
  unitPrice?: number;
  notes?: string;
}

export interface ReceivePurchaseOrderDTO {
  purchaseOrderId: string;
  items: Array<{
    itemId: string;
    receivedQuantity: number;
    lotNumber?: string;
    unitCost?: number;
    locationId?: string;
  }>;
  receivedDate: Date;
  userId: string;
}

export interface CreateConfirmationDTO {
  purchaseOrderId: string;
  confirmationDate: Date;
  confirmedBy?: string;
  isRevised: boolean;
  revisionNotes?: string;
  status: 'CONFIRMED' | 'REVISED' | 'REJECTED';
  documentUrl?: string;
}

// ============================================
// QUERY FILTERS
// ============================================

export interface PurchaseOrderFilters {
  supplierId?: string;
  status?: PurchaseOrderStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string; // orderNumber or supplier name
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PurchaseOrderItemFilters {
  purchaseOrderId?: string;
  productId?: string;
  pendingOnly?: boolean; // receivedQuantity < quantity
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface PurchaseOrderSummary {
  id: string;
  orderNumber: string;
  supplier: {
    id: string;
    code: string;
    name: string;
  };
  orderDate: Date;
  expectedDeliveryDate?: Date | null;
  status: PurchaseOrderStatus;
  totalAmount?: number;
  itemCount: number;
  receivedItemCount: number;
  pendingItemCount: number;
}

export interface PurchaseOrderStats {
  total: number;
  byStatus: Array<{
    status: PurchaseOrderStatus;
    count: number;
    totalAmount: number;
  }>;
  pending: number;
  confirmed: number;
  partial: number;
  completed: number;
  cancelled: number;
  overdueCount: number;
  thisMonthCount: number;
  thisMonthAmount: number;
}

export interface SupplierPurchaseHistory {
  supplier: {
    id: string;
    code: string;
    name: string;
  };
  totalOrders: number;
  totalAmount: number;
  averageDeliveryTime: number; // days
  onTimeDeliveryRate: number; // percentage
  recentOrders: PurchaseOrderSummary[];
}

export interface PendingReceiveReport {
  purchaseOrderId: string;
  orderNumber: string;
  supplier: string;
  expectedDate?: Date | null;
  daysOverdue?: number;
  items: Array<{
    productCode: string;
    productName: string;
    orderedQuantity: number;
    receivedQuantity: number;
    pendingQuantity: number;
  }>;
}

// ============================================
// CONFIRMATION TYPES
// ============================================

export interface ConfirmationSummary {
  purchaseOrderId: string;
  orderNumber: string;
  supplier: string;
  latestConfirmation?: {
    date: Date;
    status: string;
    confirmedBy?: string;
    isRevised: boolean;
  };
  awaitingConfirmation: boolean;
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const createPurchaseOrderSchema = {
  supplierId: { required: true, format: 'uuid' },
  orderDate: { required: true, format: 'date' },
  expectedDeliveryDate: { required: false, format: 'date' },
  items: {
    required: true,
    minItems: 1,
    itemSchema: {
      productId: { required: true, format: 'uuid' },
      quantity: { required: true, min: 0.001 },
      unitPrice: { required: false, min: 0 },
    },
  },
};

export const receiveOrderSchema = {
  purchaseOrderId: { required: true, format: 'uuid' },
  receivedDate: { required: true, format: 'date' },
  items: {
    required: true,
    minItems: 1,
    itemSchema: {
      itemId: { required: true, format: 'uuid' },
      receivedQuantity: { required: true, min: 0.001 },
      locationId: { required: false, format: 'uuid' },
    },
  },
};

export const confirmOrderSchema = {
  purchaseOrderId: { required: true, format: 'uuid' },
  confirmationDate: { required: true, format: 'date' },
  status: { required: true, enum: ['CONFIRMED', 'REVISED', 'REJECTED'] },
  isRevised: { required: true, format: 'boolean' },
};