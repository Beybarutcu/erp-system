import { WorkOrder, WorkOrderStatus } from '@prisma/client';

export interface WorkOrderWithRelations extends WorkOrder {
  product: any;
  machine?: any;
  order?: any;
  bomItem?: any;
  operations?: any[];
  progress?: WorkOrderProgress;
}

export interface WorkOrderProgress {
  plannedQuantity: number;
  producedQuantity: number;
  scrapQuantity: number;
  remainingQuantity: number;
  progressPercentage: number;
}

export interface CreateWorkOrderDTO {
  productId: string;
  bomItemId?: string;
  orderId?: string;
  plannedQuantity: number;
  machineId?: string;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  priority?: number;
  isOutsourced?: boolean;
  outsourceSupplierId?: string;
}

export interface RecordProductionDTO {
  quantityProduced: number;
  quantityScrap?: number;
  operatorId?: string;
  notes?: string;
}

export interface StartWorkOrderDTO {
  machineId?: string;
  operatorId?: string;
}

export interface MaterialCheckResult {
  available: boolean;
  shortages: string[];
}

export interface WorkOrderFilters {
  status?: WorkOrderStatus;
  machineId?: string;
  productId?: string;
  orderId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export { WorkOrderStatus };
