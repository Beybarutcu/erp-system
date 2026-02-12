import { BaseEntity } from "./common.types";

export interface InventoryLot extends BaseEntity {
  lotNumber: string;
  productId: string;
  productName: string;
  quantity: number;
  availableQuantity: number;
  warehouseLocation: string;
  expirationDate?: string;
  status: LotStatus;
  receivedDate: string;
  manufacturingDate?: string;
  batchNumber?: string;
}

export type LotStatus = "available" | "reserved" | "quarantine" | "expired";

export interface StockMovement extends BaseEntity {
  lotId: string;
  productId: string;
  type: MovementType;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  referenceNumber?: string;
  referenceType?: "work-order" | "purchase-order" | "transfer" | "adjustment";
  reason?: string;
  performedBy: string;
}

export type MovementType =
  | "receipt"
  | "consumption"
  | "transfer"
  | "adjustment"
  | "scrap";

export interface ConsumeStockDto {
  lotId: string;
  productId: string;
  quantity: number;
  reason: ConsumptionReason;
  workOrderId?: string;
  notes?: string;
}

export type ConsumptionReason =
  | "production"
  | "quality-testing"
  | "rework"
  | "waste"
  | "sample"
  | "other";

export interface TransferStockDto {
  lotId: string;
  quantity: number;
  fromLocation: string;
  toLocation: string;
  reason?: string;
}

export interface InventoryFilters {
  search?: string;
  productId?: string;
  status?: LotStatus;
  warehouseLocation?: string;
  expiringBefore?: string;
}
