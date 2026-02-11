// ============================================
// MOLD TRACKING TYPES
// backend/src/modules/molds/molds.types.ts
// ============================================

import {
  Mold,
  MoldMaintenance,
  MoldUsage,
  MoldStatus,
  Product,
  WorkOrder,
  WarehouseLocation,
} from '@prisma/client';

// ============================================
// BASE TYPES
// ============================================

export interface MoldWithDetails extends Mold {
  location?: WarehouseLocation | null;
  products: Product[];
  maintenance: MoldMaintenance[];
  usage: MoldUsageWithWorkOrder[];
  _count: {
    products: number;
    maintenance: number;
    usage: number;
  };
}

export interface MoldMaintenanceWithMold extends MoldMaintenance {
  mold: Mold;
}

export interface MoldUsageWithWorkOrder extends MoldUsage {
  mold: Mold;
  workOrder: WorkOrder & {
    product: Product;
  };
}

// ============================================
// DTO TYPES
// ============================================

export interface CreateMoldDTO {
  code: string;
  name: string;
  cavityCount: number;
  cycleTimeSeconds?: number;
  ownership: 'OWN' | 'CUSTOMER';
  locationId?: string;
  maintenanceIntervalShots?: number;
  acquisitionDate?: Date;
  cost?: number;
  notes?: string;
}

export interface UpdateMoldDTO {
  name?: string;
  cavityCount?: number;
  cycleTimeSeconds?: number;
  status?: MoldStatus;
  locationId?: string;
  maintenanceIntervalShots?: number;
  notes?: string;
}

export interface CreateMaintenanceDTO {
  moldId: string;
  maintenanceDate: Date;
  maintenanceType: 'PREVENTIVE' | 'CORRECTIVE' | 'CLEANING';
  description?: string;
  cost?: number;
  performedBy?: string;
  notes?: string;
}

export interface RecordMoldUsageDTO {
  moldId: string;
  workOrderId: string;
  startDate: Date;
  endDate?: Date;
  shotsProduced: number;
  defectCount?: number;
  notes?: string;
}

// ============================================
// QUERY FILTERS
// ============================================

export interface MoldFilters {
  status?: MoldStatus;
  ownership?: 'OWN' | 'CUSTOMER';
  locationId?: string;
  needsMaintenance?: boolean; // shots >= nextMaintenanceShots
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MaintenanceFilters {
  moldId?: string;
  maintenanceType?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  page?: number;
  limit?: number;
}

export interface UsageFilters {
  moldId?: string;
  workOrderId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface MoldSummary {
  id: string;
  code: string;
  name: string;
  status: MoldStatus;
  ownership: string;
  cavityCount: number;
  totalShots: number;
  lastMaintenanceDate?: Date | null;
  nextMaintenanceShots?: number | null;
  shotsUntilMaintenance?: number;
  location?: {
    id: string;
    fullCode: string;
  } | null;
  productsCount: number;
}

export interface MoldStats {
  total: number;
  byStatus: Array<{
    status: MoldStatus;
    count: number;
  }>;
  byOwnership: Array<{
    ownership: string;
    count: number;
  }>;
  active: number;
  maintenance: number;
  broken: number;
  needsMaintenance: number;
  totalShots: number;
  averageShots: number;
}

export interface MaintenanceSchedule {
  moldId: string;
  moldCode: string;
  moldName: string;
  totalShots: number;
  lastMaintenanceShots?: number | null;
  nextMaintenanceShots?: number | null;
  shotsUntilMaintenance?: number;
  lastMaintenanceDate?: Date | null;
  estimatedMaintenanceDate?: Date | null;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface MoldUtilization {
  moldId: string;
  moldCode: string;
  moldName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalShots: number;
  totalDefects: number;
  defectRate: number; // percentage
  utilizationHours: number;
  workOrders: number;
  averageCycleTime?: number;
}

export interface MoldPerformance {
  mold: {
    id: string;
    code: string;
    name: string;
  };
  totalProduction: number;
  totalDefects: number;
  qualityRate: number; // percentage
  totalDowntime: number; // hours
  uptimeRate: number; // percentage
  lastUsed?: Date | null;
  averageSetupTime?: number; // minutes
}

export interface MoldLifecycle {
  moldId: string;
  moldCode: string;
  acquisitionDate?: Date | null;
  totalShots: number;
  totalMaintenances: number;
  totalCost: number; // acquisition + maintenance
  costPerShot: number;
  estimatedLifeRemaining?: number; // shots
  age: number; // days
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const createMoldSchema = {
  code: { required: true, maxLength: 50 },
  name: { required: true, maxLength: 255 },
  cavityCount: { required: true, min: 1 },
  cycleTimeSeconds: { required: false, min: 1 },
  ownership: { required: true, enum: ['OWN', 'CUSTOMER'] },
  locationId: { required: false, format: 'uuid' },
};

export const createMaintenanceSchema = {
  moldId: { required: true, format: 'uuid' },
  maintenanceDate: { required: true, format: 'date' },
  maintenanceType: { 
    required: true, 
    enum: ['PREVENTIVE', 'CORRECTIVE', 'CLEANING'] 
  },
  cost: { required: false, min: 0 },
};

export const recordUsageSchema = {
  moldId: { required: true, format: 'uuid' },
  workOrderId: { required: true, format: 'uuid' },
  startDate: { required: true, format: 'date' },
  shotsProduced: { required: true, min: 1 },
  defectCount: { required: false, min: 0 },
};