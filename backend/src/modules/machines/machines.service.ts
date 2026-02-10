import { prisma } from '@shared/database/client';
import { Prisma, MachineStatus } from '@prisma/client';
import { AppError } from '@shared/middleware/error-handler';
import { cache } from '@shared/database/redis';
import { WebSocketService } from '@shared/utils/websocket';
import { 
  PaginationParams, 
  PaginatedResponse,
  CapacityReport,
  Translation 
} from '@shared/types';
import { 
  createPaginatedResponse,
  calculateUtilization,
  getUtilizationStatus 
} from '@shared/utils/helpers';
import { Decimal } from '@prisma/client/runtime/library';

export class MachinesService {
  /**
   * Get all machines with filters
   */
  async getMachines(
    params: PaginationParams & {
      status?: MachineStatus;
      machineType?: string;
      location?: string;
    },
    languageCode: string = 'tr'
  ): Promise<PaginatedResponse<any>> {
    const { 
      page = 1, 
      limit = 50, 
      sortBy = 'code', 
      sortOrder = 'asc',
      status,
      machineType,
      location 
    } = params;

    const where: Prisma.MachineWhereInput = {
      isActive: true,
    };

    if (status) where.status = status;
    if (machineType) where.machineType = machineType;
    if (location) where.location = { contains: location, mode: 'insensitive' };

    const [machines, total] = await Promise.all([
      prisma.machine.findMany({
        where,
        include: {
          translations: {
            where: { languageCode },
          },
          shifts: {
            where: { isActive: true },
          },
          _count: {
            select: {
              workOrders: true,
              maintenance: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.machine.count({ where }),
    ]);

    return createPaginatedResponse(machines, total, params);
  }

  /**
   * Get machine by ID
   */
  async getMachineById(id: string, languageCode: string = 'tr') {
    const cacheKey = `machine:${id}:${languageCode}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const machine = await prisma.machine.findUnique({
      where: { id },
      include: {
        translations: {
          where: { languageCode },
        },
        shifts: {
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' },
        },
        maintenance: {
          orderBy: { scheduledDate: 'desc' },
          take: 10,
        },
        workOrders: {
          where: {
            status: { in: ['PLANNED', 'IN_PROGRESS'] },
          },
          include: {
            product: {
              include: {
                translations: { where: { languageCode } },
              },
            },
          },
          orderBy: { plannedStartDate: 'asc' },
        },
        _count: {
          select: {
            workOrders: true,
            maintenance: true,
          },
        },
      },
    });

    if (!machine) {
      throw new AppError('Machine not found', 404);
    }

    await cache.set(cacheKey, machine, 300);

    return machine;
  }

  /**
   * Create machine
   */
  async createMachine(data: {
    code: string;
    machineType: string;
    capacityPerHour?: number;
    location?: string;
    translations: Translation[];
  }) {
    const existing = await prisma.machine.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new AppError('Machine code already exists', 400);
    }

    const machine = await prisma.machine.create({
      data: {
        code: data.code,
        machineType: data.machineType,
        capacityPerHour: data.capacityPerHour,
        location: data.location,
        status: 'ACTIVE',
        translations: {
          create: data.translations,
        },
      },
      include: {
        translations: true,
      },
    });

    await cache.deletePattern('machines:*');

    return machine;
  }

  /**
   * Update machine
   */
  async updateMachine(
    id: string,
    data: {
      code?: string;
      machineType?: string;
      capacityPerHour?: number;
      status?: MachineStatus;
      location?: string;
    }
  ) {
    const existing = await prisma.machine.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Machine not found', 404);
    }

    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.machine.findUnique({
        where: { code: data.code },
      });

      if (duplicate) {
        throw new AppError('Machine code already exists', 400);
      }
    }

    const machine = await prisma.machine.update({
      where: { id },
      data,
      include: {
        translations: true,
      },
    });

    await cache.delete(`machine:${id}:tr`);
    await cache.delete(`machine:${id}:en`);
    await cache.deletePattern('machines:*');

    // If status changed, emit WebSocket event
    if (data.status && data.status !== existing.status) {
      WebSocketService.emitToMachine(id, 'machine:status-changed', {
        machineId: id,
        oldStatus: existing.status,
        newStatus: data.status,
      });
    }

    return machine;
  }

  /**
   * Delete machine (soft delete)
   */
  async deleteMachine(id: string) {
    const machine = await prisma.machine.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            workOrders: true,
          },
        },
      },
    });

    if (!machine) {
      throw new AppError('Machine not found', 404);
    }

    if (machine._count.workOrders > 0) {
      throw new AppError('Cannot delete machine with work orders', 400);
    }

    await prisma.machine.update({
      where: { id },
      data: { isActive: false },
    });

    await cache.delete(`machine:${id}:tr`);
    await cache.delete(`machine:${id}:en`);
    await cache.deletePattern('machines:*');

    return { message: 'Machine deleted successfully' };
  }

  /**
   * Get machine schedule
   */
  async getMachineSchedule(
    id: string,
    startDate: Date,
    endDate: Date,
    languageCode: string = 'tr'
  ) {
    const machine = await prisma.machine.findUnique({
      where: { id },
      include: {
        translations: { where: { languageCode } },
      },
    });

    if (!machine) {
      throw new AppError('Machine not found', 404);
    }

    // Get work orders in date range
    const workOrders = await prisma.workOrder.findMany({
      where: {
        machineId: id,
        status: { in: ['PLANNED', 'IN_PROGRESS', 'PAUSED'] },
        OR: [
          {
            plannedStartDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            plannedEndDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        ],
      },
      include: {
        product: {
          include: {
            translations: { where: { languageCode } },
          },
        },
        order: true,
      },
      orderBy: { plannedStartDate: 'asc' },
    });

    // Get maintenance in date range
    const maintenance = await prisma.machineMaintenance.findMany({
      where: {
        machineId: id,
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });

    return {
      machine,
      workOrders,
      maintenance,
      dateRange: { startDate, endDate },
    };
  }

  /**
   * Calculate machine utilization
   */
  async getMachineUtilization(
    id: string,
    startDate: Date,
    endDate: Date
  ): Promise<CapacityReport> {
    const machine = await prisma.machine.findUnique({
      where: { id },
      include: {
        shifts: { where: { isActive: true } },
      },
    });

    if (!machine) {
      throw new AppError('Machine not found', 404);
    }

    // Calculate available hours based on shifts
    const totalAvailableHours = this.calculateShiftHours(
      machine.shifts,
      startDate,
      endDate
    );

    // Calculate maintenance hours
    const maintenanceHours = await this.calculateMaintenanceHours(
      id,
      startDate,
      endDate
    );

    const netAvailableHours = totalAvailableHours - maintenanceHours;

    // Calculate allocated hours from work orders
    const allocatedHours = await this.calculateAllocatedHours(
      id,
      startDate,
      endDate
    );

    const remainingCapacity = Math.max(0, netAvailableHours - allocatedHours);
    const utilizationRate = calculateUtilization(allocatedHours, netAvailableHours);

    return {
      machineId: id,
      totalAvailableHours,
      maintenanceHours,
      netAvailableHours,
      allocatedHours,
      remainingCapacity,
      utilizationRate,
      status: getUtilizationStatus(utilizationRate),
    };
  }

  /**
   * Get all machines utilization overview
   */
  async getUtilizationOverview(startDate: Date, endDate: Date) {
    const machines = await prisma.machine.findMany({
      where: {
        isActive: true,
        status: 'ACTIVE',
      },
      include: {
        translations: { where: { languageCode: 'tr' } },
      },
    });

    const utilizationReports = await Promise.all(
      machines.map(async (machine) => {
        const utilization = await this.getMachineUtilization(
          machine.id,
          startDate,
          endDate
        );

        return {
          machine: {
            id: machine.id,
            code: machine.code,
            name: machine.translations[0]?.name || machine.code,
            machineType: machine.machineType,
          },
          ...utilization,
        };
      })
    );

    // Calculate overall statistics
    const summary = {
      totalMachines: utilizationReports.length,
      available: utilizationReports.filter(r => r.status === 'AVAILABLE').length,
      busy: utilizationReports.filter(r => r.status === 'BUSY').length,
      critical: utilizationReports.filter(r => r.status === 'CRITICAL').length,
      overloaded: utilizationReports.filter(r => r.status === 'OVERLOADED').length,
      averageUtilization: utilizationReports.reduce((sum, r) => sum + r.utilizationRate, 0) / utilizationReports.length,
    };

    return {
      summary,
      machines: utilizationReports,
    };
  }

  /**
   * Schedule maintenance
   */
  async scheduleMaintenance(data: {
    machineId: string;
    maintenanceType: 'PREVENTIVE' | 'BREAKDOWN';
    scheduledDate: Date;
    durationHours: number;
    notes?: string;
  }) {
    const machine = await prisma.machine.findUnique({
      where: { id: data.machineId },
    });

    if (!machine) {
      throw new AppError('Machine not found', 404);
    }

    const maintenance = await prisma.machineMaintenance.create({
      data: {
        machineId: data.machineId,
        maintenanceType: data.maintenanceType,
        scheduledDate: data.scheduledDate,
        durationHours: data.durationHours,
        notes: data.notes,
        status: 'PLANNED',
      },
    });

    // If breakdown maintenance, update machine status
    if (data.maintenanceType === 'BREAKDOWN') {
      await this.updateMachine(data.machineId, {
        status: 'BROKEN',
      });
    }

    await cache.deletePattern(`machine:${data.machineId}:*`);

    return maintenance;
  }

  /**
   * Complete maintenance
   */
  async completeMaintenance(id: string) {
    const maintenance = await prisma.machineMaintenance.findUnique({
      where: { id },
      include: { machine: true },
    });

    if (!maintenance) {
      throw new AppError('Maintenance record not found', 404);
    }

    const updated = await prisma.machineMaintenance.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(),
      },
    });

    // Update machine status back to active
    if (maintenance.machine.status === 'MAINTENANCE' || maintenance.machine.status === 'BROKEN') {
      await this.updateMachine(maintenance.machineId, {
        status: 'ACTIVE',
      });
    }

    return updated;
  }

  /**
   * Add/Update shifts
   */
  async updateShifts(
    machineId: string,
    shifts: Array<{
      dayOfWeek: number;
      shiftName: string;
      startTime: Date;
      endTime: Date;
    }>
  ) {
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
    });

    if (!machine) {
      throw new AppError('Machine not found', 404);
    }

    // Delete existing shifts
    await prisma.machineShift.deleteMany({
      where: { machineId },
    });

    // Create new shifts
    await prisma.machineShift.createMany({
      data: shifts.map(shift => ({
        machineId,
        ...shift,
      })),
    });

    await cache.delete(`machine:${machineId}:tr`);
    await cache.delete(`machine:${machineId}:en`);

    return { message: 'Shifts updated successfully' };
  }

  /**
   * Get machine types summary
   */
  async getMachineTypesSummary() {
    const summary = await prisma.machine.groupBy({
      by: ['machineType', 'status'],
      where: { isActive: true },
      _count: true,
    });

    return summary.map(item => ({
      machineType: item.machineType,
      status: item.status,
      count: item._count,
    }));
  }

  /**
   * Get machine performance metrics
   */
  async getMachinePerformance(
    id: string,
    startDate: Date,
    endDate: Date
  ) {
    const workOrders = await prisma.workOrder.findMany({
      where: {
        machineId: id,
        actualStartDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
    });

    const totalPlanned = workOrders.reduce(
      (sum, wo) => sum + Number(wo.plannedQuantity),
      0
    );

    const totalProduced = workOrders.reduce(
      (sum, wo) => sum + Number(wo.producedQuantity),
      0
    );

    const totalScrap = workOrders.reduce(
      (sum, wo) => sum + Number(wo.scrapQuantity),
      0
    );

    const efficiency = totalPlanned > 0 
      ? (totalProduced / totalPlanned) * 100 
      : 0;

    const scrapRate = (totalProduced + totalScrap) > 0
      ? (totalScrap / (totalProduced + totalScrap)) * 100
      : 0;

    // Calculate average cycle time
    const totalCycleTime = workOrders.reduce((sum, wo) => {
      if (wo.actualStartDate && wo.actualEndDate) {
        const hours = (wo.actualEndDate.getTime() - wo.actualStartDate.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }
      return sum;
    }, 0);

    const averageCycleTime = workOrders.length > 0
      ? totalCycleTime / workOrders.length
      : 0;

    return {
      machineId: id,
      period: { startDate, endDate },
      completedWorkOrders: workOrders.length,
      totalPlanned,
      totalProduced,
      totalScrap,
      efficiency: Math.round(efficiency * 100) / 100,
      scrapRate: Math.round(scrapRate * 100) / 100,
      averageCycleTime: Math.round(averageCycleTime * 100) / 100,
    };
  }

  // Helper methods

  private calculateShiftHours(
    shifts: any[],
    startDate: Date,
    endDate: Date
  ): number {
    let totalHours = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay() || 7; // 1=Mon, 7=Sun

      const dayShifts = shifts.filter(s => s.dayOfWeek === dayOfWeek);

      for (const shift of dayShifts) {
        const start = new Date(shift.startTime);
        const end = new Date(shift.endTime);

        let shiftHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        // Handle overnight shifts
        if (shiftHours < 0) {
          shiftHours += 24;
        }

        totalHours += shiftHours;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return totalHours;
  }

  private async calculateMaintenanceHours(
    machineId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const maintenance = await prisma.machineMaintenance.findMany({
      where: {
        machineId,
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return maintenance.reduce((sum, m) => sum + (m.durationHours || 0), 0);
  }

  private async calculateAllocatedHours(
    machineId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const workOrders = await prisma.workOrder.findMany({
      where: {
        machineId,
        status: { in: ['PLANNED', 'IN_PROGRESS'] },
        plannedStartDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        bomItem: true,
      },
    });

    let totalHours = 0;

    for (const wo of workOrders) {
      const remaining = Number(wo.plannedQuantity) - Number(wo.producedQuantity) - Number(wo.scrapQuantity);
      
      if (wo.bomItem && wo.bomItem.cycleTimeSeconds) {
        const cycleHours = (remaining * wo.bomItem.cycleTimeSeconds) / 3600;
        const setupHours = (wo.bomItem.setupTimeMinutes || 0) / 60;
        totalHours += cycleHours + setupHours;
      }
    }

    return totalHours;
  }
}

export default new MachinesService();
