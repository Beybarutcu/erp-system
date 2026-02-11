import { prisma } from '@shared/database/client';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class ReportingService {
  /**
   * Production Report - Üretim raporu
   */
  async getProductionReport(params: {
    startDate: Date;
    endDate: Date;
    productId?: string;
    machineId?: string;
    status?: string;
  }) {
    const { startDate, endDate, productId, machineId, status } = params;

    const where: Prisma.WorkOrderWhereInput = {
      plannedStartDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (productId) where.productId = productId;
    if (machineId) where.machineId = machineId;
    if (status) where.status = status as any;

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        product: {
          include: {
            translations: true,
          },
        },
        machine: {
          include: {
            translations: true,
          },
        },
      },
      orderBy: {
        plannedStartDate: 'asc',
      },
    });

    const totalPlanned = workOrders.reduce((sum, wo) => sum + Number(wo.plannedQuantity), 0);
    const totalProduced = workOrders.reduce((sum, wo) => sum + Number(wo.producedQuantity || 0), 0);
    const totalScrap = workOrders.reduce((sum, wo) => sum + Number(wo.scrapQuantity || 0), 0);

    const byProduct = workOrders.reduce((acc: any, wo) => {
      const productCode = wo.product.code;
      if (!acc[productCode]) {
        acc[productCode] = {
          productCode,
          productName: wo.product.translations?.[0]?.name || wo.product.code,
          planned: 0,
          produced: 0,
          scrap: 0,
        };
      }
      acc[productCode].planned += Number(wo.plannedQuantity);
      acc[productCode].produced += Number(wo.producedQuantity || 0);
      acc[productCode].scrap += Number(wo.scrapQuantity || 0);
      return acc;
    }, {});

    return {
      summary: {
        totalWorkOrders: workOrders.length,
        totalPlanned,
        totalProduced,
        totalScrap,
        efficiency: totalPlanned > 0 ? (totalProduced / totalPlanned) * 100 : 0,
      },
      byProduct: Object.values(byProduct),
      workOrders: workOrders.map(wo => ({
        woNumber: wo.woNumber,
        product: wo.product.translations?.[0]?.name || wo.product.code,
        machine: wo.machine?.translations?.[0]?.name || wo.machine?.code,
        status: wo.status,
        planned: Number(wo.plannedQuantity),
        produced: Number(wo.producedQuantity || 0),
      })),
    };
  }

  /**
   * Inventory Report - Stok raporu
   */
  async getInventoryReport(params: {
    lowStock?: boolean;
    agingDays?: number;
  }) {

    const products = await prisma.product.findMany({
      include: {
        translations: true,
        inventoryLots: {
          where: {
            status: 'ACTIVE',
            currentQuantity: { gt: 0 },
          },
        },
      },
    });

    const report = products.map(product => {
      const totalStock = product.inventoryLots.reduce(
        (sum, lot) => sum.plus(lot.currentQuantity),
        new Decimal(0)
      );

      const oldestLot = product.inventoryLots.sort(
        (a, b) => a.receivedDate.getTime() - b.receivedDate.getTime()
      )[0];

      const ageInDays = oldestLot
        ? Math.floor((Date.now() - oldestLot.receivedDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const avgCost = product.inventoryLots.length > 0
        ? product.inventoryLots.reduce((sum, lot) => sum.plus(lot.unitCost || 0), new Decimal(0))
            .dividedBy(product.inventoryLots.length)
        : new Decimal(0);

      return {
        productCode: product.code,
        productName: product.translations?.[0]?.name || product.code,
        totalStock: Number(totalStock),
        lotCount: product.inventoryLots.length,
        oldestLotAge: ageInDays,
        avgCost: Number(avgCost),
        totalValue: Number(totalStock.times(avgCost)),
      };
    });

    let filteredReport = report;

    if (params.agingDays) {
        filteredReport = filteredReport.filter(item => item.oldestLotAge >= params.agingDays!);
    };

    const summary = {
      totalProducts: filteredReport.length,
      totalValue: filteredReport.reduce((sum, item) => sum + item.totalValue, 0),
    };

    return {
      summary,
      items: filteredReport,
    };
  }

  /**
   * Sales Report - Satış raporu
   */
  async getSalesReport(params: {
    startDate: Date;
    endDate: Date;
    customerId?: string;
    status?: string;
  }) {
    const { startDate, endDate, customerId, status } = params;

    const where: Prisma.OrderWhereInput = {
      orderDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (customerId) where.customerId = customerId;
    if (status) where.status = status as any;

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                translations: true,
              },
            },
          },
        },
      },
      orderBy: {
        orderDate: 'asc',
      },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    const byCustomer = orders.reduce((acc: any, order) => {
      const customerId = order.customer.id;
      if (!acc[customerId]) {
        acc[customerId] = {
          customerName: order.customer.name,
          orderCount: 0,
          totalRevenue: 0,
        };
      }
      acc[customerId].orderCount += 1;
      acc[customerId].totalRevenue += Number(order.totalAmount || 0);
      return acc;
    }, {});

    return {
      summary: {
        totalOrders: orders.length,
        totalRevenue,
        avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      },
      byCustomer: Object.values(byCustomer),
      orders: orders.map(order => ({
        orderNumber: order.orderNumber,
        customer: order.customer.name,
        orderDate: order.orderDate,
        status: order.status,
        totalAmount: Number(order.totalAmount || 0),
      })),
    };
  }

  /**
   * Machine Utilization Report - Makine kullanım raporu
   */
  async getMachineUtilizationReport(params: {
    startDate: Date;
    endDate: Date;
    machineId?: string;
  }) {
    const { startDate, endDate, machineId } = params;

    const where: Prisma.MachineWhereInput = {};
    if (machineId) where.id = machineId;

    const machines = await prisma.machine.findMany({
      where,
      include: {
        translations: true,
        workOrders: {
          where: {
            plannedStartDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });

    const report = machines.map(machine => {
      const totalWorkOrders = machine.workOrders.length;
      const completedWorkOrders = machine.workOrders.filter(wo => wo.status === 'COMPLETED').length;

      let totalProductionHours = 0;
      machine.workOrders.forEach(wo => {
        if (wo.actualStartDate && wo.actualEndDate) {
          const hours = (new Date(wo.actualEndDate).getTime() - new Date(wo.actualStartDate).getTime()) / (1000 * 60 * 60);
          totalProductionHours += hours;
        }
      });

      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const availableHours = days * 16;
      const utilization = availableHours > 0 ? (totalProductionHours / availableHours) * 100 : 0;

      return {
        machineCode: machine.code,
        machineName: machine.translations?.[0]?.name || machine.code,
        totalWorkOrders,
        completedWorkOrders,
        totalProductionHours: Math.round(totalProductionHours * 100) / 100,
        utilization: Math.round(utilization * 100) / 100,
      };
    });

    return {
      summary: {
        totalMachines: machines.length,
        avgUtilization: report.reduce((sum, m) => sum + m.utilization, 0) / (report.length || 1),
      },
      machines: report,
    };
  }

  /**
   * Financial Summary Report - Finansal özet raporu
   */
  async getFinancialSummaryReport(params: {
    startDate: Date;
    endDate: Date;
  }) {
    const { startDate, endDate } = params;

    const orders = await prisma.order.aggregate({
      where: {
        orderDate: { gte: startDate, lte: endDate },
        status: { in: ['COMPLETED', 'PENDING'] },
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    const inventoryLots = await prisma.inventoryLot.findMany({
      where: {
        status: 'ACTIVE',
        currentQuantity: { gt: 0 },
      },
    });

    const inventoryValue = inventoryLots.reduce((sum, lot) => {
      return sum + (Number(lot.currentQuantity) * Number(lot.unitCost || 0));
    }, 0);

    return {
      period: { startDate, endDate },
      sales: {
        totalRevenue: Number(orders._sum.totalAmount || 0),
        orderCount: orders._count,
      },
      inventory: {
        totalValue: inventoryValue,
        lotCount: inventoryLots.length,
      },
    };
  }

  /**
   * Material Consumption Report - Basitleştirilmiş versiyon
   */
  async getMaterialConsumptionReport(params: {
    startDate: Date;
    endDate: Date;
    productId?: string;
  }) {
    // Bu rapor için WorkOrder'dan tahmin yapıyoruz
    const where: Prisma.WorkOrderWhereInput = {
      actualStartDate: {
        gte: params.startDate,
        lte: params.endDate,
      },
    };

    if (params.productId) where.productId = params.productId;

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        product: {
          include: {
            translations: true,
          },
        },
      },
    });

    const totalProduced = workOrders.reduce((sum, wo) => sum + Number(wo.producedQuantity || 0), 0);

    return {
      summary: {
        totalWorkOrders: workOrders.length,
        totalProduced,
        period: { startDate: params.startDate, endDate: params.endDate },
      },
      workOrders: workOrders.map(wo => ({
        woNumber: wo.woNumber,
        product: wo.product.translations?.[0]?.name || wo.product.code,
        produced: Number(wo.producedQuantity || 0),
      })),
    };
  }
}

export default new ReportingService();