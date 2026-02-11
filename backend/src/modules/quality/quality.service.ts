// ============================================
// QUALITY CONTROL SERVICE
// backend/src/modules/quality/quality.service.ts
// ============================================

import { prisma } from '@shared/database/client';
import { AppError } from '@shared/middleware/error-handler';
import { Prisma } from '@prisma/client';
import {
  QualityMeasurementFilters,
  FinalInspectionFilters,
  DefectFilters,
  CreateQualityMeasurementDTO,
  CreateFinalInspectionDTO,
  UpdateQualityMeasurementDTO,
  UpdateFinalInspectionDTO,
  QualityStats,
  DefectAnalysis,
} from './quality.types';

export class QualityService {
  // ============================================
  // QUALITY MEASUREMENTS
  // ============================================

  async getQualityMeasurements(filters: QualityMeasurementFilters = {}, languageCode: string = 'tr') {
    const { page = 1, limit = 20, ...restFilters } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.QualityMeasurementWhereInput = {};

    if (restFilters.workOrderId) {
      where.workOrderId = restFilters.workOrderId;
    }

    if (restFilters.measuredBy) {
      where.measuredBy = restFilters.measuredBy;
    }

    if (restFilters.overallResult) {
      where.overallResult = restFilters.overallResult;
    }

    if (restFilters.startDate || restFilters.endDate) {
      where.measurementTime = {};
      if (restFilters.startDate) {
        where.measurementTime.gte = restFilters.startDate;
      }
      if (restFilters.endDate) {
        where.measurementTime.lte = restFilters.endDate;
      }
    }

    const [measurements, total] = await Promise.all([
      prisma.qualityMeasurement.findMany({
        where,
        include: {
          workOrder: {
            include: {
              product: {
                include: {
                  translations: {
                    where: { languageCode },
                  },
                },
              },
            },
          },
          measurer: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
          defects: true,
        },
        skip,
        take: limit,
        orderBy: { measurementTime: 'desc' },
      }),
      prisma.qualityMeasurement.count({ where }),
    ]);

    return {
      data: measurements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMeasurementById(id: string, languageCode: string = 'tr') {
    const measurement = await prisma.qualityMeasurement.findUnique({
      where: { id },
      include: {
        workOrder: {
          include: {
            product: {
              include: {
                translations: {
                  where: { languageCode },
                },
              },
            },
          },
        },
        measurer: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        defects: true,
      },
    });

    if (!measurement) {
      throw new AppError('Quality measurement not found', 404);
    }

    return measurement;
  }

  async createQualityMeasurement(data: CreateQualityMeasurementDTO) {
    // Validate work order exists
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: data.workOrderId },
    });

    if (!workOrder) {
      throw new AppError('Work order not found', 404);
    }

    // Validate measurer exists
    const measurer = await prisma.user.findUnique({
      where: { id: data.measuredBy },
    });

    if (!measurer) {
      throw new AppError('Measurer user not found', 404);
    }

    // Create measurement with defects in transaction
    const measurement = await prisma.$transaction(async (tx) => {
      const created = await tx.qualityMeasurement.create({
        data: {
          workOrderId: data.workOrderId,
          measuredBy: data.measuredBy,
          sampleSize: data.sampleSize,
          parametersJson: data.parametersJson,
          overallResult: data.overallResult,
          defectCount: data.defectCount || 0,
          defectTypes: data.defectTypes,
          notes: data.notes,
        },
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
          measurer: true,
        },
      });

      // Create defects if provided
      if (data.defects && data.defects.length > 0) {
        await tx.qualityDefect.createMany({
          data: data.defects.map((defect) => ({
            measurementId: created.id,
            defectType: defect.defectType,
            severity: defect.severity,
            quantity: defect.quantity,
            description: defect.description,
            photo: defect.photo,
          })),
        });
      }

      return created;
    });

    return measurement;
  }

  async updateQualityMeasurement(id: string, data: UpdateQualityMeasurementDTO) {
    const measurement = await prisma.qualityMeasurement.update({
      where: { id },
      data,
      include: {
        workOrder: {
          include: {
            product: true,
          },
        },
        measurer: true,
      },
    });

    return measurement;
  }

  // ============================================
  // FINAL INSPECTIONS
  // ============================================

  async getFinalInspections(filters: FinalInspectionFilters = {}, languageCode: string = 'tr') {
    const { page = 1, limit = 20, ...restFilters } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.FinalInspectionWhereInput = {};

    if (restFilters.lotId) {
      where.lotId = restFilters.lotId;
    }

    if (restFilters.workOrderId) {
      where.workOrderId = restFilters.workOrderId;
    }

    if (restFilters.inspectedBy) {
      where.inspectedBy = restFilters.inspectedBy;
    }

    if (restFilters.overallResult) {
      where.overallResult = restFilters.overallResult;
    }

    if (restFilters.startDate || restFilters.endDate) {
      where.inspectionDate = {};
      if (restFilters.startDate) {
        where.inspectionDate.gte = restFilters.startDate;
      }
      if (restFilters.endDate) {
        where.inspectionDate.lte = restFilters.endDate;
      }
    }

    const [inspections, total] = await Promise.all([
      prisma.finalInspection.findMany({
        where,
        include: {
          lot: {
            include: {
              product: {
                include: {
                  translations: {
                    where: { languageCode },
                  },
                },
              },
            },
          },
          workOrder: true,
          inspector: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
          defects: true,
        },
        skip,
        take: limit,
        orderBy: { inspectionDate: 'desc' },
      }),
      prisma.finalInspection.count({ where }),
    ]);

    return {
      data: inspections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInspectionById(id: string, languageCode: string = 'tr') {
    const inspection = await prisma.finalInspection.findUnique({
      where: { id },
      include: {
        lot: {
          include: {
            product: {
              include: {
                translations: {
                  where: { languageCode },
                },
              },
            },
          },
        },
        workOrder: true,
        inspector: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        defects: true,
      },
    });

    if (!inspection) {
      throw new AppError('Final inspection not found', 404);
    }

    return inspection;
  }

  async createFinalInspection(data: CreateFinalInspectionDTO) {
    // Validate lot exists
    const lot = await prisma.inventoryLot.findUnique({
      where: { id: data.lotId },
    });

    if (!lot) {
      throw new AppError('Inventory lot not found', 404);
    }

    // Validate inspector exists
    const inspector = await prisma.user.findUnique({
      where: { id: data.inspectedBy },
    });

    if (!inspector) {
      throw new AppError('Inspector user not found', 404);
    }

    // Validate quantities
    if (data.acceptedQuantity + data.rejectedQuantity !== data.totalQuantity) {
      throw new AppError('Accepted + Rejected quantities must equal total quantity', 400);
    }

    // Create inspection with defects in transaction
    const inspection = await prisma.$transaction(async (tx) => {
      const created = await tx.finalInspection.create({
        data: {
          lotId: data.lotId,
          workOrderId: data.workOrderId,
          inspectedBy: data.inspectedBy,
          totalQuantity: data.totalQuantity,
          acceptedQuantity: data.acceptedQuantity,
          rejectedQuantity: data.rejectedQuantity,
          measurementsJson: data.measurementsJson,
          visualInspectionPass: data.visualInspectionPass,
          functionalTestPass: data.functionalTestPass,
          overallResult: data.overallResult,
          photos: data.photos || [],
          notes: data.notes,
        },
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
          inspector: true,
        },
      });

      // Create defects if provided
      if (data.defects && data.defects.length > 0) {
        await tx.qualityDefect.createMany({
          data: data.defects.map((defect) => ({
            inspectionId: created.id,
            defectType: defect.defectType,
            severity: defect.severity,
            quantity: defect.quantity,
            description: defect.description,
            photo: defect.photo,
          })),
        });
      }

      // Update lot quality status based on result
      if (data.overallResult === 'APPROVED') {
        await tx.inventoryLot.update({
          where: { id: data.lotId },
          data: { qualityStatus: 'APPROVED' },
        });
      } else if (data.overallResult === 'REJECTED') {
        await tx.inventoryLot.update({
          where: { id: data.lotId },
          data: { qualityStatus: 'REJECTED' },
        });
      }

      return created;
    });

    return inspection;
  }

  async updateFinalInspection(id: string, data: UpdateFinalInspectionDTO) {
    const inspection = await prisma.finalInspection.update({
      where: { id },
      data,
      include: {
        lot: {
          include: {
            product: true,
          },
        },
        inspector: true,
      },
    });

    return inspection;
  }

  // ============================================
  // DEFECTS
  // ============================================

  async getDefects(filters: DefectFilters = {}) {
    const { page = 1, limit = 50, ...restFilters } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.QualityDefectWhereInput = {};

    if (restFilters.defectType) {
      where.defectType = restFilters.defectType;
    }

    if (restFilters.severity) {
      where.severity = restFilters.severity;
    }

    if (restFilters.startDate || restFilters.endDate) {
      where.createdAt = {};
      if (restFilters.startDate) {
        where.createdAt.gte = restFilters.startDate;
      }
      if (restFilters.endDate) {
        where.createdAt.lte = restFilters.endDate;
      }
    }

    const [defects, total] = await Promise.all([
      prisma.qualityDefect.findMany({
        where,
        include: {
          measurement: {
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
          inspection: {
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
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.qualityDefect.count({ where }),
    ]);

    return {
      data: defects,
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

  async getQualityStats(): Promise<QualityStats> {
    const [
      measurementStats,
      inspectionStats,
      defectStats,
      defectsByType,
    ] = await Promise.all([
      prisma.qualityMeasurement.groupBy({
        by: ['overallResult'],
        _count: { _all: true },
      }),
      prisma.finalInspection.groupBy({
        by: ['overallResult'],
        _count: { _all: true },
      }),
      prisma.qualityDefect.groupBy({
        by: ['severity'],
        _count: { _all: true },
      }),
      prisma.qualityDefect.groupBy({
        by: ['defectType'],
        _count: { _all: true },
        orderBy: { _count: { defectType: 'desc' } },
        take: 10,
      }),
    ]);

    const measurementMap = measurementStats.reduce((acc, item) => {
      acc[item.overallResult] = item._count._all;
      return acc;
    }, {} as Record<string, number>);

    const inspectionMap = inspectionStats.reduce((acc, item) => {
      acc[item.overallResult] = item._count._all;
      return acc;
    }, {} as Record<string, number>);

    const defectMap = defectStats.reduce((acc, item) => {
      acc[item.severity] = item._count._all;
      return acc;
    }, {} as Record<string, number>);

    const totalMeasurements = measurementStats.reduce((sum, item) => sum + item._count._all, 0);
    const totalInspections = inspectionStats.reduce((sum, item) => sum + item._count._all, 0);
    const totalDefects = defectStats.reduce((sum, item) => sum + item._count._all, 0);

    return {
      measurements: {
        total: totalMeasurements,
        passed: measurementMap.PASS || 0,
        failed: measurementMap.FAIL || 0,
        conditional: measurementMap.CONDITIONAL || 0,
        passRate: totalMeasurements > 0 
          ? Math.round(((measurementMap.PASS || 0) / totalMeasurements) * 100 * 100) / 100
          : 0,
      },
      inspections: {
        total: totalInspections,
        approved: inspectionMap.APPROVED || 0,
        rejected: inspectionMap.REJECTED || 0,
        conditional: inspectionMap.CONDITIONAL || 0,
        approvalRate: totalInspections > 0
          ? Math.round(((inspectionMap.APPROVED || 0) / totalInspections) * 100 * 100) / 100
          : 0,
      },
      defects: {
        total: totalDefects,
        minor: defectMap.MINOR || 0,
        major: defectMap.MAJOR || 0,
        critical: defectMap.CRITICAL || 0,
        byType: defectsByType.map((item) => ({
          type: item.defectType,
          count: item._count._all,
        })),
      },
      trends: {
        period: 'week',
        passRateTrend: 0, // TODO: Implement trend calculation
        defectRateTrend: 0,
      },
    };
  }

  async getDefectAnalysis(startDate: Date, endDate: Date): Promise<DefectAnalysis> {
    const defects = await prisma.qualityDefect.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        measurement: {
          include: {
            workOrder: {
              select: { productId: true },
            },
          },
        },
        inspection: {
          include: {
            lot: {
              select: { productId: true },
            },
          },
        },
      },
    });

    const totalDefects = defects.length;

    // By severity
    const bySeverity = defects.reduce((acc, defect) => {
      acc[defect.severity] = (acc[defect.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // By type
    const byType = defects.reduce((acc, defect) => {
      if (!acc[defect.defectType]) {
        acc[defect.defectType] = { count: 0, severity: defect.severity };
      }
      acc[defect.defectType].count += 1;
      return acc;
    }, {} as Record<string, { count: number; severity: string }>);

    // Affected products
    const affectedProducts = new Set(
      defects.map((d) => d.measurement?.workOrder?.productId || d.inspection?.lot?.productId).filter(Boolean)
    );

    return {
      totalDefects,
      period: { startDate, endDate },
      bySeverity: Object.entries(bySeverity).map(([severity, count]) => ({
        severity,
        count,
        percentage: Math.round((count / totalDefects) * 100 * 100) / 100,
      })),
      byType: Object.entries(byType)
        .map(([type, data]) => ({
          type,
          count: data.count,
          percentage: Math.round((data.count / totalDefects) * 100 * 100) / 100,
          severity: data.severity,
        }))
        .sort((a, b) => b.count - a.count),
      topDefects: Object.entries(byType)
        .map(([type, data]) => ({
          type,
          count: data.count,
          affectedProducts: affectedProducts.size,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      trend: {
        previousPeriodTotal: 0, // TODO: Calculate previous period
        change: 0,
        direction: 'stable',
      },
    };
  }
}

export default new QualityService();