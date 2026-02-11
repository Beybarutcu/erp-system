// ============================================
// WAREHOUSE & LOCATION TYPES
// backend/src/modules/warehouse/warehouse.types.ts
// ============================================

import { 
  Warehouse, 
  WarehouseZone, 
  WarehouseLocation, 
  LocationTransfer,
  InventoryLot,
  Product
} from '@prisma/client';

// ============================================
// BASE TYPES
// ============================================

export interface WarehouseWithDetails extends Warehouse {
  zones: WarehouseZoneWithLocations[];
  _count: {
    zones: number;
    locations: number;
  };
}

export interface WarehouseZoneWithLocations extends WarehouseZone {
  warehouse: Warehouse;
  locations: WarehouseLocationWithOccupancy[];
  _count: {
    locations: number;
  };
}

export interface WarehouseLocationWithOccupancy extends WarehouseLocation {
  warehouse: Warehouse;
  zone?: WarehouseZone | null;
  occupancyPercentage?: number;
  inventoryLots?: InventoryLotSummary[];
}

export interface WarehouseLocationWithDetails extends WarehouseLocation {
  warehouse: Warehouse;
  zone?: WarehouseZone | null;
  inventoryLots: Array<InventoryLot & {
    product: Product;
  }>;
  transfersFrom: LocationTransfer[];
  transfersTo: LocationTransfer[];
  occupancyPercentage: number;
}

export interface LocationTransferWithDetails extends LocationTransfer {
  lot: InventoryLot & { product: Product };
  fromLocation?: WarehouseLocation | null;
  toLocation: WarehouseLocation;
}

export interface InventoryLotSummary {
  lotNumber: string;
  productCode: string;
  productName: string;
  quantity: number;
}

// ============================================
// DTO TYPES
// ============================================

export interface CreateWarehouseDTO {
  code: string;
  name: string;
  address?: string;
}

export interface UpdateWarehouseDTO {
  name?: string;
  address?: string;
  isActive?: boolean;
}

export interface CreateWarehouseZoneDTO {
  warehouseId: string;
  code: string;
  name: string;
}

export interface CreateWarehouseLocationDTO {
  warehouseId: string;
  zoneId?: string;
  code: string;
  locationType: 'PALLET' | 'SHELF' | 'FLOOR' | 'RACK';
  capacity?: number;
}

export interface UpdateWarehouseLocationDTO {
  capacity?: number;
  isActive?: boolean;
}

export interface LocationTransferDTO {
  lotId: string;
  fromLocationId?: string;
  toLocationId: string;
  quantity: number;
  reason?: string;
  userId: string;
}

// ============================================
// QUERY FILTERS
// ============================================

export interface WarehouseFilters {
  isActive?: boolean;
  search?: string;
}

export interface LocationFilters {
  warehouseId?: string;
  zoneId?: string;
  locationType?: string;
  isActive?: boolean;
  hasSpace?: boolean; // capacity > currentOccupancy
  search?: string;
  page?: number;
  limit?: number;
}

export interface TransferFilters {
  lotId?: string;
  fromLocationId?: string;
  toLocationId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface OccupancyReport {
  warehouse: {
    id: string;
    code: string;
    name: string;
  };
  totalCapacity: number;
  totalOccupancy: number;
  occupancyPercentage: number;
  zoneReports: Array<{
    zone: {
      id: string;
      code: string;
      name: string;
    };
    totalCapacity: number;
    totalOccupancy: number;
    occupancyPercentage: number;
    locationCount: number;
  }>;
  locationTypeReports: Array<{
    locationType: string;
    count: number;
    totalCapacity: number;
    totalOccupancy: number;
    occupancyPercentage: number;
  }>;
}

export interface LocationAvailability {
  locationId: string;
  locationCode: string;
  capacity: number;
  currentOccupancy: number;
  availableSpace: number;
  occupancyPercentage: number;
  isAvailable: boolean;
}

export interface TransferSummary {
  totalTransfers: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
  byLocation: Array<{
    locationId: string;
    locationCode: string;
    transfersIn: number;
    transfersOut: number;
    netChange: number;
  }>;
}

// ============================================
// VALIDATION SCHEMAS (for Zod)
// ============================================

export const createWarehouseSchema = {
  code: { required: true, maxLength: 50 },
  name: { required: true, maxLength: 255 },
  address: { required: false, maxLength: 500 },
};

export const createLocationSchema = {
  warehouseId: { required: true, format: 'uuid' },
  zoneId: { required: false, format: 'uuid' },
  code: { required: true, maxLength: 100 },
  locationType: { 
    required: true, 
    enum: ['PALLET', 'SHELF', 'FLOOR', 'RACK'] 
  },
  capacity: { required: false, min: 0 },
};

export const transferSchema = {
  lotId: { required: true, format: 'uuid' },
  fromLocationId: { required: false, format: 'uuid' },
  toLocationId: { required: true, format: 'uuid' },
  quantity: { required: true, min: 0.001 },
  reason: { required: false, maxLength: 500 },
};