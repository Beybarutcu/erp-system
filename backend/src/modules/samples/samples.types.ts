// ============================================
// TYPES - samples.types.ts
// ============================================

import { SampleRequest, SampleProduction, SampleApproval, SampleStatus, Customer } from '@prisma/client';

export interface SampleRequestWithDetails extends SampleRequest {
  customer: Customer;
  productions: SampleProduction[];
  approvals: SampleApproval[];
  _count: { productions: number; approvals: number };
}

export interface CreateSampleRequestDTO {
  customerId: string;
  productId?: string;
  requestDate: Date;
  requestedQuantity: number;
  deadline?: Date;
  technicalDrawing?: string;
  notes?: string;
}

export interface UpdateSampleRequestDTO {
  deadline?: Date;
  status?: SampleStatus;
  notes?: string;
}

export interface CreateSampleProductionDTO {
  sampleRequestId: string;
  workOrderId?: string;
  productionDate: Date;
  producedQuantity: number;
  photos?: string[];
  notes?: string;
}

export interface CreateSampleApprovalDTO {
  sampleRequestId: string;
  approvalDate: Date;
  approvalStatus: 'APPROVED' | 'REVISION' | 'REJECTED';
  customerFeedback?: string;
  revisionNotes?: string;
  documentUrl?: string;
}

export interface SampleFilters {
  customerId?: string;
  status?: SampleStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface SampleStats {
  total: number;
  byStatus: Array<{ status: SampleStatus; count: number }>;
  pending: number;
  inProduction: number;
  sent: number;
  approved: number;
  rejected: number;
  averageLeadTime: number; // days
  approvalRate: number; // percentage
}