// ============================================
// CONTROLLER - samples.controller.ts
// ============================================

import { Request, Response, NextFunction } from 'express';
import samplesService from './samples.service';
import { parsePaginationParams } from '@shared/utils/helpers';
import { SampleStatus } from '@prisma/client';

export const getSamples = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      ...parsePaginationParams(req.query),
      customerId: req.query.customerId as string | undefined,
      status: req.query.status as SampleStatus | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const result = await samplesService.getSamples(filters);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

export const getSampleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const sample = await samplesService.getSampleById(id);
    res.json({ success: true, data: sample });
  } catch (error) {
    next(error);
  }
};

export const createSample = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sample = await samplesService.createSample(req.body);
    res.status(201).json({ success: true, data: sample, message: 'Sample request created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateSample = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const sample = await samplesService.updateSample(id, req.body);
    res.json({ success: true, data: sample, message: 'Sample request updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const recordProduction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const production = await samplesService.recordProduction(req.body);
    res.status(201).json({ success: true, data: production, message: 'Sample production recorded successfully' });
  } catch (error) {
    next(error);
  }
};

export const markAsSent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const sample = await samplesService.markAsSent(id);
    res.json({ success: true, data: sample, message: 'Sample marked as sent' });
  } catch (error) {
    next(error);
  }
};

export const recordApproval = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const approval = await samplesService.recordApproval(req.body);
    res.status(201).json({ success: true, data: approval, message: 'Sample approval recorded successfully' });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await samplesService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};