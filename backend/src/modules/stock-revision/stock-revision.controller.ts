// ============================================
// CONTROLLER - stock-revision.controller.ts
// ============================================

import { Request, Response, NextFunction } from 'express';
import stockRevisionService from './stock-revision.service';
import { parsePaginationParams } from '@shared/utils/helpers';

export const getRevisions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      ...parsePaginationParams(req.query),
      productId: req.query.productId as string | undefined,
      status: req.query.status as string | undefined,
      reason: req.query.reason as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const result = await stockRevisionService.getRevisions(filters, req.user?.languagePreference || 'tr');
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

export const createRevision = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = { ...req.body, revisedBy: req.user!.id };
    const revision = await stockRevisionService.createRevision(data);
    res.status(201).json({ success: true, data: revision, message: 'Stock revision created successfully' });
  } catch (error) {
    next(error);
  }
};

export const approveRevision = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = { approvedBy: req.user!.id, notes: req.body.notes };
    const revision = await stockRevisionService.approveRevision(id, data);
    res.json({ success: true, data: revision, message: 'Revision approved successfully' });
  } catch (error) {
    next(error);
  }
};

export const rejectRevision = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const revision = await stockRevisionService.rejectRevision(id, req.user!.id, req.body.notes);
    res.json({ success: true, data: revision, message: 'Revision rejected successfully' });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await stockRevisionService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
