// ============================================
// SERVICE - stock-revision.service.ts
// ============================================

import { prisma } from '@shared/database/client';
import { AppError } from '@shared/middleware/error-handler';
import { Prisma } from '@prisma/client';

export class StockRevisionService {
  async getRevisions(filters: StockRevisionFilters = {}, languageCode: string = 'tr') {
    const { page = 1, limit = 20, ...restFilters } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.StockRevisionWhereInput = {};

    if (restFilters.productId) where.productId = restFilters.productId;
    if (restFilters.status) where.status = restFilters.status;
    if (restFilters.reason) where.reason = restFilters.reason;

    if (restFilters.startDate || restFilters.endDate) {
      where.revisionDate = {};
      if (restFilters.startDate) where.revisionDate.gte = restFilters.startDate;
      if (restFilters.endDate) where.revisionDate.lte = restFilters.endDate;
    }

    const [revisions, total] = await Promise.all([
      prisma.stockRevision.findMany({
        where,
        include: {
          reviser: { select: { id: true, username: true, fullName: true } },
          approver: { select: { id: true, username: true, fullName: true } },
        },
        skip,
        take: limit,
        orderBy: { revisionDate: 'desc' },
      }),
      prisma.stockRevision.count({ where }),
    ]);

    return {
      data: revisions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createRevision(data: CreateStockRevisionDTO) {
    const difference = data.countedQuantity - data.systemQuantity;

    // Generate revision number
    const count = await prisma.stockRevision.count();
    const revisionNumber = `REV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const revision = await prisma.stockRevision.create({
      data: {
        revisionNumber,
        productId: data.productId,
        lotId: data.lotId,
        revisionDate: data.revisionDate,
        systemQuantity: data.systemQuantity,
        countedQuantity: data.countedQuantity,
        difference,
        reason: data.reason,
        notes: data.notes,
        revisedBy: data.revisedBy,
        status: 'PENDING',
      },
      include: {
        reviser: true,
      },
    });

    return revision;
  }

  async approveRevision(id: string, data: ApproveRevisionDTO) {
    const revision = await prisma.stockRevision.findUnique({ where: { id } });
    if (!revision) throw new AppError('Revision not found', 404);
    if (revision.status !== 'PENDING') throw new AppError('Revision already processed', 400);

    // Update revision and adjust inventory
    const updated = await prisma.$transaction(async (tx) => {
      const approved = await tx.stockRevision.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedBy: data.approvedBy,
          approvalDate: new Date(),
          notes: data.notes || revision.notes,
        },
        include: { reviser: true, approver: true },
      });

      // Adjust lot quantity if lotId exists
      if (revision.lotId) {
        await tx.inventoryLot.update({
          where: { id: revision.lotId },
          data: { quantity: revision.countedQuantity },
        });

        // Create inventory transaction
        await tx.inventoryTransaction.create({
          data: {
            lotId: revision.lotId,
            type: 'ADJUSTMENT',
            quantity: Math.abs(Number(revision.difference)),
            beforeQuantity: revision.systemQuantity,
            afterQuantity: revision.countedQuantity,
            userId: data.approvedBy,
            reason: revision.reason,
            notes: `Stock revision: ${revision.revisionNumber}`,
          },
        });
      }

      return approved;
    });

    return updated;
  }

  async rejectRevision(id: string, approvedBy: string, notes?: string) {
    const revision = await prisma.stockRevision.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy,
        approvalDate: new Date(),
        notes,
      },
      include: { reviser: true, approver: true },
    });

    return revision;
  }

  async getStats(): Promise<RevisionStats> {
    const [total, byStatus, byReason] = await Promise.all([
      prisma.stockRevision.count(),
      prisma.stockRevision.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.stockRevision.groupBy({
        by: ['reason'],
        _count: { reason: true },
        _sum: { difference: true },
      }),
    ]);

    const statusMap = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      pending: statusMap.PENDING || 0,
      approved: statusMap.APPROVED || 0,
      rejected: statusMap.REJECTED || 0,
      totalDifference: byReason.reduce((sum, item) => sum + Number(item._sum.difference || 0), 0),
      byReason: byReason.map((item) => ({
        reason: item.reason,
        count: item._count.reason,
        totalDifference: Number(item._sum.difference || 0),
      })),
    };
  }
}

export default new StockRevisionService();
