import { BaseEntity } from "./common.types";

export interface WorkOrder extends BaseEntity {
  workOrderNumber: string;
  productId: string;
  productName: string;
  quantity: number;
  producedQuantity: number;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  dueDate: string;
  startDate?: string;
  completionDate?: string;
  assignedMachineId?: string;
  assignedMachineName?: string;
  notes?: string;
}

export type WorkOrderStatus =
  | "pending"
  | "scheduled"
  | "in-progress"
  | "paused"
  | "completed"
  | "cancelled";

export type WorkOrderPriority = "low" | "medium" | "high" | "urgent";

export interface CreateWorkOrderDto {
  productId: string;
  quantity: number;
  dueDate: string;
  priority: WorkOrderPriority;
  assignedMachineId?: string;
  notes?: string;
}

export interface UpdateWorkOrderDto extends Partial<CreateWorkOrderDto> {
  id: string;
  status?: WorkOrderStatus;
}

export interface RecordProductionDto {
  workOrderId: string;
  producedQuantity: number;
  goodQuantity: number;
  defectiveQuantity: number;
  wasteQuantity: number;
  lotNumber: string;
  warehouseLocation: string;
  qualityStatus: "passed" | "pending" | "failed";
  notes?: string;
}

export interface WorkOrderFilters {
  search?: string;
  status?: WorkOrderStatus;
  priority?: WorkOrderPriority;
  productId?: string;
}
