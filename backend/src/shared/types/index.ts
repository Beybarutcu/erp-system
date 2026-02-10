// Shared Types for ERP System

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;
}

export interface DateRange {
  startDate: Date | string;
  endDate: Date | string;
}

export interface Translation {
  languageCode: string;
  name: string;
  description?: string;
}

// BOM Types
export interface BOMTreeNode {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  level: number;
  children?: BOMTreeNode[];
  operationType?: string;
  machineType?: string;
  cycleTimeSeconds?: number;
  setupTimeMinutes?: number;
  scrapRate?: number;
}

export interface BOMExplosionItem {
  productId: string;
  productCode: string;
  productName: string;
  totalRequired: number;
  totalWithScrap: number;
  availableStock: number;
  shortage: number;
  hasSufficientStock: boolean;
}

// Inventory Types
export interface LotAllocation {
  lotId: string;
  lotNumber: string;
  quantity: number;
  unitCost: number;
  receivedDate: Date;
}

export interface StockConsumption {
  productId: string;
  consumedQuantity: number;
  consumed: LotAllocation[];
  totalCost: number;
  method: 'FIFO' | 'MANUAL';
}

// Work Order Types
export interface WorkOrderProgress {
  plannedQuantity: number;
  producedQuantity: number;
  scrapQuantity: number;
  remainingQuantity: number;
  progressPercentage: number;
}

// Capacity Types
export interface CapacityReport {
  machineId: string;
  totalAvailableHours: number;
  maintenanceHours: number;
  netAvailableHours: number;
  allocatedHours: number;
  remainingCapacity: number;
  utilizationRate: number;
  status: 'AVAILABLE' | 'BUSY' | 'CRITICAL' | 'OVERLOADED';
}

// Notification Types
export interface NotificationData {
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  messageKey: string;
  messageParams?: Record<string, any>;
  referenceType?: string;
  referenceId?: string;
}

// WebSocket Event Types
export interface WebSocketEvent {
  event: string;
  data: any;
  timestamp: Date;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';
export type ProductType = 'RAW_MATERIAL' | 'SEMI_FINISHED' | 'FINISHED' | 'MOLD' | 'OUTSOURCED';
export type LotStatus = 'ACTIVE' | 'BLOCKED' | 'OUTSOURCED' | 'SCRAP';
export type WorkOrderStatus = 'PLANNED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type OrderStatus = 'PENDING' | 'IN_PRODUCTION' | 'READY' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
export type MachineStatus = 'ACTIVE' | 'MAINTENANCE' | 'BROKEN' | 'INACTIVE';
