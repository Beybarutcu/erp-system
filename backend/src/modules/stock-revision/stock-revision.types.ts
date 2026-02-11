// ============================================
// TYPES - stock-revision.types.ts
// ============================================

import { StockRevision, User, Product } from '@prisma/client';

export interface StockRevisionWithDetails extends StockRevision {
  reviser: User;
  approver?: User | null;
  product?: Product;
}

export interface CreateStockRevisionDTO {
  productId: string;
  lotId?: string;
  revisionDate: Date;
  systemQuantity: number;
  countedQuantity: number;
  reason: 'PERIODIC_COUNT' | 'WASTE' | 'LOSS' | 'DAMAGE' | 'CORRECTION';
  notes?: string;
  revisedBy: string;
}

export interface ApproveRevisionDTO {
  approvedBy: string;
  notes?: string;
}

export interface StockRevisionFilters {
  productId?: string;
  status?: string;
  reason?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface RevisionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalDifference: number;
  byReason: Array<{
    reason: string;
    count: number;
    totalDifference: number;
  }>;
}