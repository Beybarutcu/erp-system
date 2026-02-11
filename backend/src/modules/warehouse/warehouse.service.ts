// ============================================
// WAREHOUSE SERVICE
// backend/src/modules/warehouse/warehouse.service.ts
// ============================================

import { prisma } from '@shared/database/client';
import { AppError } from '@shared/middleware/error-handler';
import { Prisma } from '@prisma/client';
import {
  WarehouseFilters,
  LocationFilters,
  TransferFilters,
  CreateWarehouseDTO,
  UpdateWarehouseDTO,
  CreateWarehouseZoneDTO,
  CreateWarehouseLocationDTO,
  UpdateWarehouseLocationDTO,
  LocationTransferDTO,
  OccupancyReport,
  LocationAvailability,
} from './warehouse.types';

export class WarehouseService {
  // ============================================
  // WAREHOUSE CRUD
  // ============================================

  async getWarehouses(filters: WarehouseFilters = {}) {
    const where: Prisma.WarehouseWhereInput = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const warehouses = await prisma.warehouse.findMany({
      where,
      include: {
        zones: {
          include: {
            _count: {
              select: { locations: true },
            },
          },
        },
        _count: {
          select: {
            zones: true,
            locations: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    return warehouses;
  }

  async getWarehouseById(id: string) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        zones: {
          include: {
            locations: true,
          },
        },
        locations: {
          include: {
            zone: true,
          },
        },
        _count: {
          select: {
            zones: true,
            locations: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new AppError('Warehouse not found', 404);
    }

    return warehouse;
  }

  async createWarehouse(data: CreateWarehouseDTO) {
    // Check if code already exists
    const existing = await prisma.warehouse.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new AppError('Warehouse code already exists', 400);
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        code: data.code,
        name: data.name,
        address: data.address,
      },
      include: {
        _count: {
          select: { zones: true, locations: true },
        },
      },
    });

    return warehouse;
  }

  async updateWarehouse(id: string, data: UpdateWarehouseDTO) {
    const warehouse = await prisma.warehouse.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { zones: true, locations: true },
        },
      },
    });

    return warehouse;
  }

  async deleteWarehouse(id: string) {
    // Check if warehouse has locations with inventory
    const locationsWithInventory = await prisma.warehouseLocation.count({
      where: {
        warehouseId: id,
        currentOccupancy: { gt: 0 },
      },
    });

    if (locationsWithInventory > 0) {
      throw new AppError(
        'Cannot delete warehouse with occupied locations',
        400
      );
    }

    await prisma.warehouse.delete({
      where: { id },
    });

    return { message: 'Warehouse deleted successfully' };
  }

  // ============================================
  // WAREHOUSE ZONES
  // ============================================

  async getZones(warehouseId?: string) {
    const where: Prisma.WarehouseZoneWhereInput = {};

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    const zones = await prisma.warehouseZone.findMany({
      where,
      include: {
        warehouse: true,
        locations: {
          select: {
            id: true,
            code: true,
            capacity: true,
            currentOccupancy: true,
          },
        },
        _count: {
          select: { locations: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    return zones;
  }

  async createZone(data: CreateWarehouseZoneDTO) {
    // Check if zone code exists in this warehouse
    const existing = await prisma.warehouseZone.findFirst({
      where: {
        warehouseId: data.warehouseId,
        code: data.code,
      },
    });

    if (existing) {
      throw new AppError('Zone code already exists in this warehouse', 400);
    }

    const zone = await prisma.warehouseZone.create({
      data,
      include: {
        warehouse: true,
      },
    });

    return zone;
  }

  // ============================================
  // WAREHOUSE LOCATIONS
  // ============================================

  async getLocations(filters: LocationFilters = {}) {
    const { page = 1, limit = 50, ...restFilters } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.WarehouseLocationWhereInput = {
      isActive: true,
    };

    if (restFilters.warehouseId) {
      where.warehouseId = restFilters.warehouseId;
    }

    if (restFilters.zoneId) {
      where.zoneId = restFilters.zoneId;
    }

    if (restFilters.locationType) {
      where.locationType = restFilters.locationType;
    }

    if (restFilters.isActive !== undefined) {
      where.isActive = restFilters.isActive;
    }

    if (restFilters.hasSpace) {
      where.AND = [
        { capacity: { not: null } },
        {
          OR: [
            {
              capacity: { gt: prisma.warehouseLocation.fields.currentOccupancy },
            },
          ],
        },
      ];
    }

    if (restFilters.search) {
      where.OR = [
        { code: { contains: restFilters.search, mode: 'insensitive' } },
        { fullCode: { contains: restFilters.search, mode: 'insensitive' } },
      ];
    }

    const [locations, total] = await Promise.all([
      prisma.warehouseLocation.findMany({
        where,
        include: {
          warehouse: true,
          zone: true,
          inventoryLots: {
            select: {
              lotNumber: true,
              quantity: true,
              product: {
                select: {
                  code: true,
                  translations: {
                    where: { languageCode: 'tr' },
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { fullCode: 'asc' },
      }),
      prisma.warehouseLocation.count({ where }),
    ]);

    // Calculate occupancy percentage
    const locationsWithOccupancy = locations.map((loc) => ({
      ...loc,
      occupancyPercentage: loc.capacity
        ? (Number(loc.currentOccupancy) / Number(loc.capacity)) * 100
        : 0,
    }));

    return {
      data: locationsWithOccupancy,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLocationById(id: string) {
    const location = await prisma.warehouseLocation.findUnique({
      where: { id },
      include: {
        warehouse: true,
        zone: true,
        inventoryLots: {
          include: {
            product: {
              include: {
                translations: {
                  where: { languageCode: 'tr' },
                },
              },
            },
          },
        },
        transfersFrom: {
          take: 10,
          orderBy: { transferDate: 'desc' },
          include: {
            toLocation: true,
          },
        },
        transfersTo: {
          take: 10,
          orderBy: { transferDate: 'desc' },
          include: {
            fromLocation: true,
          },
        },
      },
    });

    if (!location) {
      throw new AppError('Location not found', 404);
    }

    const occupancyPercentage = location.capacity
      ? (Number(location.currentOccupancy) / Number(location.capacity)) * 100
      : 0;

    return {
      ...location,
      occupancyPercentage,
    };
  }

  async createLocation(data: CreateWarehouseLocationDTO) {
    // Generate full code
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: data.warehouseId },
    });

    if (!warehouse) {
      throw new AppError('Warehouse not found', 404);
    }

    let zoneCode = '';
    if (data.zoneId) {
      const zone = await prisma.warehouseZone.findUnique({
        where: { id: data.zoneId },
      });
      if (zone) {
        zoneCode = zone.code;
      }
    }

    const fullCode = zoneCode
      ? `${warehouse.code}-${zoneCode}-${data.code}`
      : `${warehouse.code}-${data.code}`;

    // Check if fullCode already exists
    const existing = await prisma.warehouseLocation.findFirst({
      where: {
        warehouseId: data.warehouseId,
        fullCode,
      },
    });

    if (existing) {
      throw new AppError('Location code already exists', 400);
    }

    const location = await prisma.warehouseLocation.create({
      data: {
        ...data,
        fullCode,
        currentOccupancy: 0,
      },
      include: {
        warehouse: true,
        zone: true,
      },
    });

    return location;
  }

  async updateLocation(id: string, data: UpdateWarehouseLocationDTO) {
    const location = await prisma.warehouseLocation.update({
      where: { id },
      data,
      include: {
        warehouse: true,
        zone: true,
      },
    });

    return location;
  }

  // ============================================
  // LOCATION TRANSFERS
  // ============================================

  async transferLot(data: LocationTransferDTO) {
    // Validate lot exists and has enough quantity
    const lot = await prisma.inventoryLot.findUnique({
      where: { id: data.lotId },
      include: { product: true },
    });

    if (!lot) {
      throw new AppError('Lot not found', 404);
    }

    if (lot.quantity.lt(data.quantity)) {
      throw new AppError('Insufficient quantity in lot', 400);
    }

    // Validate locations exist
    const toLocation = await prisma.warehouseLocation.findUnique({
      where: { id: data.toLocationId },
    });

    if (!toLocation) {
      throw new AppError('Destination location not found', 404);
    }

    let fromLocation = null;
    if (data.fromLocationId) {
      fromLocation = await prisma.warehouseLocation.findUnique({
        where: { id: data.fromLocationId },
      });
      if (!fromLocation) {
        throw new AppError('Source location not found', 404);
      }
    }

    // Check destination capacity
    if (toLocation.capacity) {
      const newOccupancy = toLocation.currentOccupancy.add(data.quantity);
      if (newOccupancy.gt(toLocation.capacity)) {
        throw new AppError('Destination location capacity exceeded', 400);
      }
    }

    // Perform transfer in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transfer record
      const transfer = await tx.locationTransfer.create({
        data: {
          lotId: data.lotId,
          fromLocationId: data.fromLocationId,
          toLocationId: data.toLocationId,
          quantity: data.quantity,
          reason: data.reason,
          userId: data.userId,
        },
      });

      // Update lot location
      await tx.inventoryLot.update({
        where: { id: data.lotId },
        data: { locationId: data.toLocationId },
      });

      // Update location occupancies
      if (data.fromLocationId) {
        await tx.warehouseLocation.update({
          where: { id: data.fromLocationId },
          data: {
            currentOccupancy: {
              decrement: data.quantity,
            },
          },
        });
      }

      await tx.warehouseLocation.update({
        where: { id: data.toLocationId },
        data: {
          currentOccupancy: {
            increment: data.quantity,
          },
        },
      });

      return transfer;
    });

    return result;
  }

  async getTransfers(filters: TransferFilters = {}) {
    const { page = 1, limit = 50, ...restFilters } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.LocationTransferWhereInput = {};

    if (restFilters.lotId) {
      where.lotId = restFilters.lotId;
    }

    if (restFilters.fromLocationId) {
      where.fromLocationId = restFilters.fromLocationId;
    }

    if (restFilters.toLocationId) {
      where.toLocationId = restFilters.toLocationId;
    }

    if (restFilters.startDate || restFilters.endDate) {
      where.transferDate = {};
      if (restFilters.startDate) {
        where.transferDate.gte = restFilters.startDate;
      }
      if (restFilters.endDate) {
        where.transferDate.lte = restFilters.endDate;
      }
    }

    const [transfers, total] = await Promise.all([
      prisma.locationTransfer.findMany({
        where,
        include: {
          lot: {
            include: {
              product: {
                include: {
                  translations: {
                    where: { languageCode: 'tr' },
                  },
                },
              },
            },
          },
          fromLocation: true,
          toLocation: true,
        },
        skip,
        take: limit,
        orderBy: { transferDate: 'desc' },
      }),
      prisma.locationTransfer.count({ where }),
    ]);

    return {
      data: transfers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // REPORTS
  // ============================================

  async getOccupancyReport(warehouseId: string): Promise<OccupancyReport> {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: {
        zones: {
          include: {
            locations: true,
          },
        },
        locations: true,
      },
    });

    if (!warehouse) {
      throw new AppError('Warehouse not found', 404);
    }

    // Calculate totals
    const totalCapacity = warehouse.locations.reduce(
      (sum, loc) => sum + Number(loc.capacity || 0),
      0
    );
    const totalOccupancy = warehouse.locations.reduce(
      (sum, loc) => sum + Number(loc.currentOccupancy),
      0
    );
    const occupancyPercentage =
      totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

    // Zone reports
    const zoneReports = warehouse.zones.map((zone) => {
      const zoneCapacity = zone.locations.reduce(
        (sum, loc) => sum + Number(loc.capacity || 0),
        0
      );
      const zoneOccupancy = zone.locations.reduce(
        (sum, loc) => sum + Number(loc.currentOccupancy),
        0
      );
      return {
        zone: {
          id: zone.id,
          code: zone.code,
          name: zone.name,
        },
        totalCapacity: zoneCapacity,
        totalOccupancy: zoneOccupancy,
        occupancyPercentage:
          zoneCapacity > 0 ? (zoneOccupancy / zoneCapacity) * 100 : 0,
        locationCount: zone.locations.length,
      };
    });

    // Location type reports
    const locationsByType = warehouse.locations.reduce((acc, loc) => {
      if (!acc[loc.locationType]) {
        acc[loc.locationType] = [];
      }
      acc[loc.locationType].push(loc);
      return acc;
    }, {} as Record<string, typeof warehouse.locations>);

    const locationTypeReports = Object.entries(locationsByType).map(
      ([type, locations]) => {
        const typeCapacity = locations.reduce(
          (sum, loc) => sum + Number(loc.capacity || 0),
          0
        );
        const typeOccupancy = locations.reduce(
          (sum, loc) => sum + Number(loc.currentOccupancy),
          0
        );
        return {
          locationType: type,
          count: locations.length,
          totalCapacity: typeCapacity,
          totalOccupancy: typeOccupancy,
          occupancyPercentage:
            typeCapacity > 0 ? (typeOccupancy / typeCapacity) * 100 : 0,
        };
      }
    );

    return {
      warehouse: {
        id: warehouse.id,
        code: warehouse.code,
        name: warehouse.name,
      },
      totalCapacity,
      totalOccupancy,
      occupancyPercentage,
      zoneReports,
      locationTypeReports,
    };
  }

  async getAvailableLocations(
    warehouseId: string,
    requiredSpace: number
  ): Promise<LocationAvailability[]> {
    const locations = await prisma.warehouseLocation.findMany({
      where: {
        warehouseId,
        isActive: true,
        capacity: { not: null },
      },
    });

    const availableLocations = locations
      .map((loc) => {
        const capacity = Number(loc.capacity || 0);
        const currentOccupancy = Number(loc.currentOccupancy);
        const availableSpace = capacity - currentOccupancy;
        const occupancyPercentage =
          capacity > 0 ? (currentOccupancy / capacity) * 100 : 0;

        return {
          locationId: loc.id,
          locationCode: loc.fullCode,
          capacity,
          currentOccupancy,
          availableSpace,
          occupancyPercentage,
          isAvailable: availableSpace >= requiredSpace,
        };
      })
      .filter((loc) => loc.isAvailable)
      .sort((a, b) => b.availableSpace - a.availableSpace);

    return availableLocations;
  }
}

export default new WarehouseService();