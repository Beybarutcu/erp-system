// ============================================
// MOLD TRACKING SERVICE
// backend/src/modules/molds/molds.service.ts
// ============================================

import { prisma } from '@shared/database/client';
import { AppError } from '@shared/middleware/error-handler';
import { Prisma } from '@prisma/client';
import {
  MoldFilters,
  MaintenanceFilters,
  UsageFilters,
  CreateMoldDTO,
  UpdateMoldDTO,
  CreateMaintenanceDTO,
  RecordMoldUsageDTO,
  MoldStats,
  MaintenanceSchedule,
  MoldUtilization,
} from './molds.types';

export class MoldsService {
  // ============================================
  // MOLD CRUD
  // ============================================

  async getMolds(filters: MoldFilters = {}) {
    const { page = 1, limit = 20, sortBy = 'code', sortOrder = 'asc', ...restFilters } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.MoldWhereInput = {
      isActive: true,
    };

    if (restFilters.status) {
      where.status = restFilters.status;
    }

    if (restFilters.ownership) {
      where.ownership = restFilters.ownership;
    }

    if (restFilters.locationId) {
      where.locationId = restFilters.locationId;
    }

    if (restFilters.needsMaintenance) {
      where.AND = [
        { nextMaintenanceShots: { not: null } },
        {
          totalShots: {
            gte: prisma.mold.fields.nextMaintenanceShots,
          },
        },
      ];
    }

    if (restFilters.search) {
      where.OR = [
        { code: { contains: restFilters.search, mode: 'insensitive' } },
        { name: { contains: restFilters.search, mode: 'insensitive' } },
      ];
    }

    const [molds, total] = await Promise.all([
      prisma.mold.findMany({
        where,
        include: {
          location: true,
          products: {
            take: 5,
            include: {
              translations: {
                where: { languageCode: 'tr' },
              },
            },
          },
          maintenance: {
            orderBy: { maintenanceDate: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              products: true,
              maintenance: true,
              usage: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.mold.count({ where }),
    ]);

    // Calculate shots until maintenance
    const moldsWithMaintenance = molds.map((mold) => ({
      ...mold,
      shotsUntilMaintenance:
        mold.nextMaintenanceShots
          ? mold.nextMaintenanceShots - mold.totalShots
          : null,
    }));

    return {
      data: moldsWithMaintenance,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMoldById(id: string) {
    const mold = await prisma.mold.findUnique({
      where: { id },
      include: {
        location: {
          include: {
            warehouse: true,
            zone: true,
          },
        },
        products: {
          include: {
            translations: {
              where: { languageCode: 'tr' },
            },
          },
        },
        maintenance: {
          orderBy: { maintenanceDate: 'desc' },
        },
        usage: {
          orderBy: { startDate: 'desc' },
          take: 20,
          include: {
            workOrder: {
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
          },
        },
        _count: {
          select: {
            products: true,
            maintenance: true,
            usage: true,
          },
        },
      },
    });

    if (!mold) {
      throw new AppError('Mold not found', 404);
    }

    return {
      ...mold,
      shotsUntilMaintenance:
        mold.nextMaintenanceShots
          ? mold.nextMaintenanceShots - mold.totalShots
          : null,
    };
  }

  async createMold(data: CreateMoldDTO) {
    // Check if code already exists
    const existing = await prisma.mold.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new AppError('Mold code already exists', 400);
    }

    // Validate location if provided
    if (data.locationId) {
      const location = await prisma.warehouseLocation.findUnique({
        where: { id: data.locationId },
      });
      if (!location) {
        throw new AppError('Location not found', 404);
      }
    }

    const mold = await prisma.mold.create({
      data: {
        code: data.code,
        name: data.name,
        cavityCount: data.cavityCount,
        cycleTimeSeconds: data.cycleTimeSeconds,
        ownership: data.ownership,
        locationId: data.locationId,
        maintenanceIntervalShots: data.maintenanceIntervalShots,
        nextMaintenanceShots: data.maintenanceIntervalShots,
        acquisitionDate: data.acquisitionDate,
        cost: data.cost,
        notes: data.notes,
        status: 'ACTIVE',
        totalShots: 0,
      },
      include: {
        location: true,
      },
    });

    return mold;
  }

  async updateMold(id: string, data: UpdateMoldDTO) {
    const mold = await prisma.mold.update({
      where: { id },
      data,
      include: {
        location: true,
        _count: {
          select: { products: true, maintenance: true },
        },
      },
    });

    return mold;
  }

  async deleteMold(id: string) {
    // Check if mold is being used in products
    const productsCount = await prisma.product.count({
      where: { moldId: id },
    });

    if (productsCount > 0) {
      throw new AppError('Cannot delete mold that is assigned to products', 400);
    }

    // Soft delete
    await prisma.mold.update({
      where: { id },
      data: { isActive: false, status: 'SCRAPPED' },
    });

    return { message: 'Mold deleted successfully' };
  }

  // ============================================
  // MAINTENANCE
  // ============================================

  async createMaintenance(data: CreateMaintenanceDTO) {
    const mold = await prisma.mold.findUnique({
      where: { id: data.moldId },
    });

    if (!mold) {
      throw new AppError('Mold not found', 404);
    }

    // Create maintenance record
    const maintenance = await prisma.moldMaintenance.create({
      data: {
        moldId: data.moldId,
        maintenanceDate: data.maintenanceDate,
        maintenanceType: data.maintenanceType,
        shotCountAtMaintenance: mold.totalShots,
        description: data.description,
        cost: data.cost,
        performedBy: data.performedBy,
        notes: data.notes,
      },
      include: {
        mold: true,
      },
    });

    // Update mold maintenance tracking
    const nextMaintenance = mold.maintenanceIntervalShots
      ? mold.totalShots + mold.maintenanceIntervalShots
      : null;

    await prisma.mold.update({
      where: { id: data.moldId },
      data: {
        lastMaintenanceDate: data.maintenanceDate,
        lastMaintenanceShots: mold.totalShots,
        nextMaintenanceShots: nextMaintenance,
        status: 'ACTIVE', // Return to active after maintenance
      },
    });

    return maintenance;
  }

  async getMaintenanceHistory(filters: MaintenanceFilters = {}) {
    const { page = 1, limit = 20, ...restFilters } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.MoldMaintenanceWhereInput = {};

    if (restFilters.moldId) {
      where.moldId = restFilters.moldId;
    }

    if (restFilters.maintenanceType) {
      where.maintenanceType = restFilters.maintenanceType;
    }

    if (restFilters.startDate || restFilters.endDate) {
      where.maintenanceDate = {};
      if (restFilters.startDate) {
        where.maintenanceDate.gte = restFilters.startDate;
      }
      if (restFilters.endDate) {
        where.maintenanceDate.lte = restFilters.endDate;
      }
    }

    const [maintenances, total] = await Promise.all([
      prisma.moldMaintenance.findMany({
        where,
        include: {
          mold: true,
        },
        skip,
        take: limit,
        orderBy: { maintenanceDate: 'desc' },
      }),
      prisma.moldMaintenance.count({ where }),
    ]);

    return {
      data: maintenances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMaintenanceSchedule(): Promise<MaintenanceSchedule[]> {
    const molds = await prisma.mold.findMany({
      where: {
        isActive: true,
        status: { in: ['ACTIVE', 'MAINTENANCE'] },
        nextMaintenanceShots: { not: null },
      },
      orderBy: { totalShots: 'desc' },
    });

    const schedule = molds
      .map((mold) => {
        const shotsUntilMaintenance = mold.nextMaintenanceShots
          ? mold.nextMaintenanceShots - mold.totalShots
          : null;

        let priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        if (shotsUntilMaintenance !== null) {
          if (shotsUntilMaintenance <= 0) {
            priority = 'URGENT';
          } else if (shotsUntilMaintenance <= 1000) {
            priority = 'HIGH';
          } else if (shotsUntilMaintenance <= 5000) {
            priority = 'MEDIUM';
          }
        }

        // Estimate maintenance date based on average usage
        let estimatedDate = null;
        if (shotsUntilMaintenance && shotsUntilMaintenance > 0 && mold.cycleTimeSeconds) {
          const hoursUntilMaintenance =
            (shotsUntilMaintenance * mold.cycleTimeSeconds) / 3600;
          estimatedDate = new Date();
          estimatedDate.setHours(estimatedDate.getHours() + hoursUntilMaintenance);
        }

        return {
          moldId: mold.id,
          moldCode: mold.code,
          moldName: mold.name,
          totalShots: mold.totalShots,
          lastMaintenanceShots: mold.lastMaintenanceShots,
          nextMaintenanceShots: mold.nextMaintenanceShots,
          shotsUntilMaintenance,
          lastMaintenanceDate: mold.lastMaintenanceDate,
          estimatedMaintenanceDate: estimatedDate,
          priority,
        };
      })
      .sort((a, b) => {
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    return schedule;
  }

  // ============================================
  // USAGE TRACKING
  // ============================================

  async recordUsage(data: RecordMoldUsageDTO) {
    // Validate mold and work order exist
    const [mold, workOrder] = await Promise.all([
      prisma.mold.findUnique({ where: { id: data.moldId } }),
      prisma.workOrder.findUnique({ where: { id: data.workOrderId } }),
    ]);

    if (!mold) {
      throw new AppError('Mold not found', 404);
    }

    if (!workOrder) {
      throw new AppError('Work order not found', 404);
    }

    // Create usage record and update mold shots
    const result = await prisma.$transaction(async (tx) => {
      const usage = await tx.moldUsage.create({
        data: {
          moldId: data.moldId,
          workOrderId: data.workOrderId,
          startDate: data.startDate,
          endDate: data.endDate,
          shotsProduced: data.shotsProduced,
          defectCount: data.defectCount || 0,
          notes: data.notes,
        },
      });

      await tx.mold.update({
        where: { id: data.moldId },
        data: {
          totalShots: { increment: data.shotsProduced },
        },
      });

      return usage;
    });

    return result;
  }

  async getUsageHistory(filters: UsageFilters = {}) {
    const { page = 1, limit = 20, ...restFilters } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.MoldUsageWhereInput = {};

    if (restFilters.moldId) {
      where.moldId = restFilters.moldId;
    }

    if (restFilters.workOrderId) {
      where.workOrderId = restFilters.workOrderId;
    }

    if (restFilters.startDate || restFilters.endDate) {
      where.startDate = {};
      if (restFilters.startDate) {
        where.startDate.gte = restFilters.startDate;
      }
      if (restFilters.endDate) {
        where.startDate.lte = restFilters.endDate;
      }
    }

    const [usages, total] = await Promise.all([
      prisma.moldUsage.findMany({
        where,
        include: {
          mold: true,
          workOrder: {
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
        },
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
      }),
      prisma.moldUsage.count({ where }),
    ]);

    return {
      data: usages,
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

  async getStats(): Promise<MoldStats> {
    const [
      total,
      byStatus,
      byOwnership,
      needsMaintenance,
      shotsSum,
    ] = await Promise.all([
      prisma.mold.count({ where: { isActive: true } }),
      prisma.mold.groupBy({
        by: ['status'],
        where: { isActive: true },
        _count: { _all: true },
      }),
      prisma.mold.groupBy({
        by: ['ownership'],
        where: { isActive: true },
        _count: { _all: true },
      }),
      prisma.mold.count({
        where: {
          isActive: true,
          nextMaintenanceShots: { not: null },
          totalShots: {
            gte: prisma.mold.fields.nextMaintenanceShots,
          },
        },
      }),
      prisma.mold.aggregate({
        where: { isActive: true },
        _sum: { totalShots: true },
      }),
    ]);

    const statusMap = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count._all,
      })),
      byOwnership: byOwnership.map((item) => ({
        ownership: item.ownership,
        count: item._count._all,
      })),
      active: statusMap.ACTIVE || 0,
      maintenance: statusMap.MAINTENANCE || 0,
      broken: statusMap.BROKEN || 0,
      needsMaintenance,
      totalShots: shotsSum._sum.totalShots || 0,
      averageShots: total > 0 ? Math.round((shotsSum._sum.totalShots || 0) / total) : 0,
    };
  }

  async getMoldUtilization(
    moldId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MoldUtilization> {
    const mold = await prisma.mold.findUnique({
      where: { id: moldId },
    });

    if (!mold) {
      throw new AppError('Mold not found', 404);
    }

    const usages = await prisma.moldUsage.findMany({
      where: {
        moldId,
        startDate: { gte: startDate, lte: endDate },
      },
    });

    const totalShots = usages.reduce((sum, u) => sum + u.shotsProduced, 0);
    const totalDefects = usages.reduce((sum, u) => sum + u.defectCount, 0);
    const defectRate = totalShots > 0 ? (totalDefects / totalShots) * 100 : 0;

    // Calculate utilization hours
    const utilizationHours = usages.reduce((sum, u) => {
      if (u.endDate) {
        const hours = (u.endDate.getTime() - u.startDate.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);

    return {
      moldId: mold.id,
      moldCode: mold.code,
      moldName: mold.name,
      period: { startDate, endDate },
      totalShots,
      totalDefects,
      defectRate: Math.round(defectRate * 100) / 100,
      utilizationHours: Math.round(utilizationHours * 10) / 10,
      workOrders: usages.length,
      averageCycleTime: mold.cycleTimeSeconds || undefined,
    };
  }
}

export default new MoldsService();