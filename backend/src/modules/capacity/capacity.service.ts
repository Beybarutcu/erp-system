import { prisma } from '@shared/database/client';
import { AppError } from '@shared/middleware/error-handler';
import machinesService from '@modules/machines/machines.service';
import { CapacityReport } from '@shared/types';
import { Decimal } from '@prisma/client/runtime/library';

export class CapacityService {
  /**
   * Get overall capacity overview
   */
  async getCapacityOverview(startDate: Date, endDate: Date) {
    // Get all active machines utilization
    const utilizationOverview = await machinesService.getUtilizationOverview(
      startDate,
      endDate
    );

    // Get pending work orders
    const pendingWorkOrders = await prisma.workOrder.count({
      where: {
        status: 'PLANNED',
      },
    });

    // Get in-progress work orders
    const inProgressWorkOrders = await prisma.workOrder.count({
      where: {
        status: 'IN_PROGRESS',
      },
    });

    // Get bottleneck machines (utilization > 90%)
    const bottlenecks = utilizationOverview.machines
      .filter(m => m.utilizationRate > 90)
      .map(m => ({
        machineId: m.machine.id,
        machineCode: m.machine.code,
        machineName: m.machine.name,
        utilizationRate: m.utilizationRate,
        overloadedBy: m.utilizationRate - 100,
      }));

    return {
      ...utilizationOverview,
      workOrders: {
        pending: pendingWorkOrders,
        inProgress: inProgressWorkOrders,
      },
      bottlenecks,
      alerts: this.generateCapacityAlerts(utilizationOverview.machines),
    };
  }

  /**
   * Calculate capacity for new work order
   */
  async calculateCapacityForWorkOrder(data: {
    productId: string;
    quantity: number;
    preferredMachineId?: string;
    startDate?: Date;
  }) {
    // Get product BOM to determine machine type and time
    const bomItem = await prisma.bomItem.findFirst({
      where: {
        parentProductId: data.productId,
        isActive: true,
      },
      orderBy: {
        sequenceOrder: 'asc',
      },
    });

    if (!bomItem) {
      throw new AppError('No BOM found for this product', 404);
    }

    // Calculate required hours
    const cycleHours = ((bomItem.cycleTimeSeconds || 0) * data.quantity) / 3600;
    const setupHours = (bomItem.setupTimeMinutes || 0) / 60;
    const totalRequiredHours = cycleHours + setupHours;

    // Find suitable machines
    let machines = await prisma.machine.findMany({
      where: {
        machineType: bomItem.machineType || undefined,
        status: 'ACTIVE',
        isActive: true,
        ...(data.preferredMachineId && { id: data.preferredMachineId }),
      },
      include: {
        translations: { where: { languageCode: 'tr' } },
      },
    });

    if (machines.length === 0) {
      throw new AppError('No suitable machines found', 404);
    }

    // Calculate availability for each machine
    const startDate = data.startDate || new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7); // Look ahead 7 days

    const machineCapacities = await Promise.all(
      machines.map(async (machine) => {
        const utilization = await machinesService.getMachineUtilization(
          machine.id,
          startDate,
          endDate
        );

        const canAccommodate = utilization.remainingCapacity >= totalRequiredHours;
        
        // Find earliest available slot
        const earliestStart = canAccommodate 
          ? await this.findEarliestSlot(machine.id, totalRequiredHours, startDate)
          : null;

        return {
          machine: {
            id: machine.id,
            code: machine.code,
            name: machine.translations[0]?.name || machine.code,
            machineType: machine.machineType,
          },
          utilization,
          requiredHours: totalRequiredHours,
          canAccommodate,
          earliestStart,
          recommendationScore: this.calculateRecommendationScore(
            utilization,
            canAccommodate,
            data.preferredMachineId === machine.id
          ),
        };
      })
    );

    // Sort by recommendation score
    machineCapacities.sort((a, b) => b.recommendationScore - a.recommendationScore);

    return {
      productId: data.productId,
      quantity: data.quantity,
      requiredHours: totalRequiredHours,
      breakdown: {
        cycleHours: Math.round(cycleHours * 100) / 100,
        setupHours: Math.round(setupHours * 100) / 100,
      },
      machineOptions: machineCapacities,
      recommendation: machineCapacities[0] || null,
    };
  }

  /**
   * Optimize work order scheduling
   */
  async optimizeSchedule(
    workOrderIds: string[],
    optimizationGoal: 'MINIMIZE_TIME' | 'BALANCE_LOAD' | 'MINIMIZE_SETUP' = 'BALANCE_LOAD'
  ) {
    const workOrders = await prisma.workOrder.findMany({
      where: {
        id: { in: workOrderIds },
        status: 'PLANNED',
      },
      include: {
        product: true,
        bomItem: true,
      },
    });

    if (workOrders.length === 0) {
      throw new AppError('No planned work orders found', 404);
    }

    // Group by machine type
    const ordersByMachineType = workOrders.reduce((acc, wo) => {
      const machineType = wo.bomItem?.machineType || 'UNKNOWN';
      if (!acc[machineType]) acc[machineType] = [];
      acc[machineType].push(wo);
      return acc;
    }, {} as Record<string, any[]>);

    const optimizedSchedule: any[] = [];

    // For each machine type group
    for (const [machineType, orders] of Object.entries(ordersByMachineType)) {
      const machines = await prisma.machine.findMany({
        where: {
          machineType,
          status: 'ACTIVE',
          isActive: true,
        },
      });

      if (machines.length === 0) continue;

      // Apply optimization strategy
      let sortedOrders = [...orders];
      
      switch (optimizationGoal) {
        case 'MINIMIZE_TIME':
          // Shortest job first
          sortedOrders.sort((a, b) => {
            const timeA = (a.bomItem?.cycleTimeSeconds || 0) * Number(a.plannedQuantity);
            const timeB = (b.bomItem?.cycleTimeSeconds || 0) * Number(b.plannedQuantity);
            return timeA - timeB;
          });
          break;
          
        case 'MINIMIZE_SETUP':
          // Group similar products
          sortedOrders.sort((a, b) => {
            if (a.productId === b.productId) return 0;
            return a.product.code.localeCompare(b.product.code);
          });
          break;
          
        case 'BALANCE_LOAD':
          // Distribute by priority and size
          sortedOrders.sort((a, b) => {
            if (a.priority !== b.priority) return b.priority - a.priority;
            return Number(b.plannedQuantity) - Number(a.plannedQuantity);
          });
          break;
      }

      // Distribute to machines in round-robin fashion
      let machineIndex = 0;
      for (const order of sortedOrders) {
        const machine = machines[machineIndex % machines.length];
        
        optimizedSchedule.push({
          workOrderId: order.id,
          workOrderNumber: order.woNumber,
          productCode: order.product.code,
          quantity: Number(order.plannedQuantity),
          assignedMachine: {
            id: machine.id,
            code: machine.code,
          },
        });

        machineIndex++;
      }
    }

    return {
      optimizationGoal,
      totalOrders: workOrders.length,
      schedule: optimizedSchedule,
    };
  }

  /**
   * Get capacity forecast
   */
  async getCapacityForecast(days: number = 30) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const forecast: any[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayEnd = new Date(currentDate);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const utilizationOverview = await machinesService.getUtilizationOverview(
        currentDate,
        dayEnd
      );

      forecast.push({
        date: new Date(currentDate),
        averageUtilization: utilizationOverview.summary.averageUtilization,
        available: utilizationOverview.summary.available,
        busy: utilizationOverview.summary.busy,
        critical: utilizationOverview.summary.critical,
        overloaded: utilizationOverview.summary.overloaded,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      period: { startDate, endDate, days },
      forecast,
      trends: this.analyzeTrends(forecast),
    };
  }

  /**
   * Check if order can be fulfilled
   */
  async checkOrderFulfillment(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                bomParent: {
                  where: { isActive: true },
                  include: {
                    childProduct: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const fulfillmentCheck: any[] = [];

    for (const item of order.items) {
      // Check material availability
      const materialCheck = await this.checkMaterialAvailability(
        item.productId,
        Number(item.quantity)
      );

      // Check capacity
      const capacityCheck = await this.calculateCapacityForWorkOrder({
        productId: item.productId,
        quantity: Number(item.quantity),
      });

      fulfillmentCheck.push({
        productId: item.productId,
        productCode: item.product.code,
        quantity: Number(item.quantity),
        materialAvailable: materialCheck.available,
        materialShortages: materialCheck.shortages,
        capacityAvailable: capacityCheck.recommendation?.canAccommodate || false,
        earliestCompletion: capacityCheck.recommendation?.earliestStart || null,
        requiredHours: capacityCheck.requiredHours,
      });
    }

    const canFulfill = fulfillmentCheck.every(
      item => item.materialAvailable && item.capacityAvailable
    );

    return {
      orderId,
      orderNumber: order.orderNumber,
      deliveryDate: order.deliveryDate,
      canFulfill,
      items: fulfillmentCheck,
      issues: fulfillmentCheck
        .filter(item => !item.materialAvailable || !item.capacityAvailable)
        .map(item => ({
          productCode: item.productCode,
          materialIssues: item.materialShortages,
          capacityIssue: !item.capacityAvailable,
        })),
    };
  }

  // Helper methods

  private async findEarliestSlot(
    machineId: string,
    requiredHours: number,
    afterDate: Date
  ): Promise<Date | null> {
    // Get machine schedule
    const endDate = new Date(afterDate);
    endDate.setDate(endDate.getDate() + 30); // Look ahead 30 days

    const schedule = await machinesService.getMachineSchedule(
      machineId,
      afterDate,
      endDate,
      'tr'
    );

    // Simple implementation: return the after date
    // In production, this should find actual gaps in the schedule
    return afterDate;
  }

  private calculateRecommendationScore(
    utilization: CapacityReport,
    canAccommodate: boolean,
    isPreferred: boolean
  ): number {
    let score = 0;

    // Can accommodate is critical
    if (!canAccommodate) return 0;

    // Prefer machines with balanced utilization (60-80%)
    if (utilization.utilizationRate >= 60 && utilization.utilizationRate <= 80) {
      score += 50;
    } else if (utilization.utilizationRate < 60) {
      score += 30; // Not fully utilized
    } else {
      score += 10; // Nearly full
    }

    // Remaining capacity bonus
    score += Math.min(30, utilization.remainingCapacity);

    // Preferred machine bonus
    if (isPreferred) {
      score += 20;
    }

    return Math.round(score);
  }

  private generateCapacityAlerts(machines: any[]) {
    const alerts: any[] = [];

    const overloaded = machines.filter(m => m.utilizationRate > 100);
    if (overloaded.length > 0) {
      alerts.push({
        type: 'OVERLOAD',
        severity: 'CRITICAL',
        message: `${overloaded.length} machine(s) overloaded`,
        machines: overloaded.map(m => m.machine.code),
      });
    }

    const critical = machines.filter(m => m.utilizationRate > 85 && m.utilizationRate <= 100);
    if (critical.length > 0) {
      alerts.push({
        type: 'HIGH_UTILIZATION',
        severity: 'WARNING',
        message: `${critical.length} machine(s) at critical capacity`,
        machines: critical.map(m => m.machine.code),
      });
    }

    const underutilized = machines.filter(m => m.utilizationRate < 30);
    if (underutilized.length > 0) {
      alerts.push({
        type: 'LOW_UTILIZATION',
        severity: 'INFO',
        message: `${underutilized.length} machine(s) underutilized`,
        machines: underutilized.map(m => m.machine.code),
      });
    }

    return alerts;
  }

  private analyzeTrends(forecast: any[]) {
    if (forecast.length < 2) return null;

    const avgUtilizations = forecast.map(f => f.averageUtilization);
    
    // Calculate trend (increasing/decreasing)
    const firstHalf = avgUtilizations.slice(0, Math.floor(avgUtilizations.length / 2));
    const secondHalf = avgUtilizations.slice(Math.floor(avgUtilizations.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const trend = secondAvg > firstAvg ? 'INCREASING' : secondAvg < firstAvg ? 'DECREASING' : 'STABLE';
    const trendStrength = Math.abs(secondAvg - firstAvg);

    return {
      trend,
      trendStrength: Math.round(trendStrength * 100) / 100,
      averageUtilization: Math.round((avgUtilizations.reduce((a, b) => a + b, 0) / avgUtilizations.length) * 100) / 100,
      peakUtilization: Math.max(...avgUtilizations),
      lowestUtilization: Math.min(...avgUtilizations),
    };
  }

  private async checkMaterialAvailability(
    productId: string,
    quantity: number
  ): Promise<{ available: boolean; shortages: string[] }> {
    const bomItems = await prisma.bomItem.findMany({
      where: {
        parentProductId: productId,
        isActive: true,
      },
      include: {
        childProduct: true,
      },
    });

    const shortages: string[] = [];

    for (const item of bomItems) {
      const required = new Decimal(quantity)
        .times(item.quantity)
        .times(1 + item.scrapRate.toNumber() / 100);

      const available = await prisma.inventoryLot.aggregate({
        where: {
          productId: item.childProductId,
          status: 'ACTIVE',
        },
        _sum: {
          currentQuantity: true,
        },
      });

      const availableQty = available._sum.currentQuantity || new Decimal(0);

      if (availableQty.lessThan(required)) {
        shortages.push(
          `${item.childProduct.code}: need ${required.toFixed(2)}, have ${availableQty.toFixed(2)}`
        );
      }
    }

    return {
      available: shortages.length === 0,
      shortages,
    };
  }
}

export default new CapacityService();
