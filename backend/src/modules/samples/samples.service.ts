// ============================================
// SERVICE - samples.service.ts
// ============================================

import { prisma } from '@shared/database/client';
import { AppError } from '@shared/middleware/error-handler';
import { Prisma } from '@prisma/client';

export class SamplesService {
  async getSamples(filters: SampleFilters = {}) {
    const { page = 1, limit = 20, ...restFilters } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.SampleRequestWhereInput = {};

    if (restFilters.customerId) where.customerId = restFilters.customerId;
    if (restFilters.status) where.status = restFilters.status;

    if (restFilters.startDate || restFilters.endDate) {
      where.requestDate = {};
      if (restFilters.startDate) where.requestDate.gte = restFilters.startDate;
      if (restFilters.endDate) where.requestDate.lte = restFilters.endDate;
    }

    const [samples, total] = await Promise.all([
      prisma.sampleRequest.findMany({
        where,
        include: {
          customer: true,
          productions: { orderBy: { productionDate: 'desc' } },
          approvals: { orderBy: { approvalDate: 'desc' } },
          _count: { select: { productions: true, approvals: true } },
        },
        skip,
        take: limit,
        orderBy: { requestDate: 'desc' },
      }),
      prisma.sampleRequest.count({ where }),
    ]);

    return {
      data: samples,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSampleById(id: string) {
    const sample = await prisma.sampleRequest.findUnique({
      where: { id },
      include: {
        customer: true,
        productions: { orderBy: { productionDate: 'desc' } },
        approvals: { orderBy: { approvalDate: 'desc' } },
        _count: { select: { productions: true, approvals: true } },
      },
    });

    if (!sample) throw new AppError('Sample request not found', 404);
    return sample;
  }

  async createSample(data: CreateSampleRequestDTO) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw new AppError('Customer not found', 404);

    const count = await prisma.sampleRequest.count();
    const requestNumber = `SAMPLE-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const sample = await prisma.sampleRequest.create({
      data: {
        requestNumber,
        customerId: data.customerId,
        productId: data.productId,
        requestDate: data.requestDate,
        requestedQuantity: data.requestedQuantity,
        deadline: data.deadline,
        technicalDrawing: data.technicalDrawing,
        notes: data.notes,
        status: 'PENDING',
      },
      include: { customer: true },
    });

    return sample;
  }

  async updateSample(id: string, data: UpdateSampleRequestDTO) {
    const sample = await prisma.sampleRequest.update({
      where: { id },
      data,
      include: { customer: true },
    });

    return sample;
  }

  async recordProduction(data: CreateSampleProductionDTO) {
    const sample = await prisma.sampleRequest.findUnique({
      where: { id: data.sampleRequestId },
    });

    if (!sample) throw new AppError('Sample request not found', 404);

    const production = await prisma.$transaction(async (tx) => {
      const created = await tx.sampleProduction.create({
        data: {
          sampleRequestId: data.sampleRequestId,
          workOrderId: data.workOrderId,
          productionDate: data.productionDate,
          producedQuantity: data.producedQuantity,
          photos: data.photos || [],
          notes: data.notes,
        },
      });

      // Update sample status
      await tx.sampleRequest.update({
        where: { id: data.sampleRequestId },
        data: { status: 'IN_PRODUCTION' },
      });

      return created;
    });

    return production;
  }

  async markAsSent(id: string) {
    const sample = await prisma.sampleRequest.update({
      where: { id },
      data: { status: 'SENT' },
      include: { customer: true },
    });

    return sample;
  }

  async recordApproval(data: CreateSampleApprovalDTO) {
    const sample = await prisma.sampleRequest.findUnique({
      where: { id: data.sampleRequestId },
    });

    if (!sample) throw new AppError('Sample request not found', 404);

    const approval = await prisma.$transaction(async (tx) => {
      const created = await tx.sampleApproval.create({
        data: {
          sampleRequestId: data.sampleRequestId,
          approvalDate: data.approvalDate,
          approvalStatus: data.approvalStatus,
          customerFeedback: data.customerFeedback,
          revisionNotes: data.revisionNotes,
          documentUrl: data.documentUrl,
        },
      });

      // Update sample status based on approval
      let newStatus: SampleStatus = sample.status;
      if (data.approvalStatus === 'APPROVED') {
        newStatus = 'APPROVED';
      } else if (data.approvalStatus === 'REJECTED') {
        newStatus = 'REJECTED';
      } else if (data.approvalStatus === 'REVISION') {
        newStatus = 'REVISION';
      }

      await tx.sampleRequest.update({
        where: { id: data.sampleRequestId },
        data: { status: newStatus },
      });

      return created;
    });

    return approval;
  }

  async getStats(): Promise<SampleStats> {
    const [total, byStatus, allSamples] = await Promise.all([
      prisma.sampleRequest.count(),
      prisma.sampleRequest.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.sampleRequest.findMany({
        include: {
          productions: { take: 1, orderBy: { productionDate: 'asc' } },
          approvals: { take: 1, orderBy: { approvalDate: 'asc' } },
        },
      }),
    ]);

    const statusMap = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average lead time
    const leadTimes = allSamples
      .filter((s) => s.productions.length > 0)
      .map((s) => {
        const prodDate = s.productions[0].productionDate;
        return (prodDate.getTime() - s.requestDate.getTime()) / (1000 * 60 * 60 * 24);
      });

    const avgLeadTime = leadTimes.length > 0
      ? Math.round(leadTimes.reduce((sum, t) => sum + t, 0) / leadTimes.length)
      : 0;

    // Calculate approval rate
    const totalApprovals = byStatus.reduce((sum, item) => {
      if (['APPROVED', 'REJECTED', 'REVISION'].includes(item.status)) {
        return sum + item._count.status;
      }
      return sum;
    }, 0);

    const approvalRate = totalApprovals > 0
      ? Math.round(((statusMap.APPROVED || 0) / totalApprovals) * 100)
      : 0;

    return {
      total,
      byStatus: byStatus.map((item) => ({ status: item.status, count: item._count.status })),
      pending: statusMap.PENDING || 0,
      inProduction: statusMap.IN_PRODUCTION || 0,
      sent: statusMap.SENT || 0,
      approved: statusMap.APPROVED || 0,
      rejected: statusMap.REJECTED || 0,
      averageLeadTime: avgLeadTime,
      approvalRate,
    };
  }
}

export default new SamplesService();
