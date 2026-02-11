// ============================================
// MOLD TRACKING CONTROLLER
// backend/src/modules/molds/molds.controller.ts
// ============================================

import { Request, Response, NextFunction } from 'express';
import moldsService from './molds.service';
import { parsePaginationParams } from '@shared/utils/helpers';
import { MoldStatus } from '@prisma/client';

export const getMolds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters = {
      ...parsePaginationParams(req.query),
      status: req.query.status as MoldStatus | undefined,
      ownership: req.query.ownership as 'OWN' | 'CUSTOMER' | undefined,
      locationId: req.query.locationId as string | undefined,
      needsMaintenance: req.query.needsMaintenance === 'true',
      search: req.query.search as string | undefined,
    };

    const result = await moldsService.getMolds(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getMoldById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const mold = await moldsService.getMoldById(id);

    res.json({
      success: true,
      data: mold,
    });
  } catch (error) {
    next(error);
  }
};

export const createMold = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const mold = await moldsService.createMold(req.body);

    res.status(201).json({
      success: true,
      data: mold,
      message: 'Mold created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateMold = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const mold = await moldsService.updateMold(id, req.body);

    res.json({
      success: true,
      data: mold,
      message: 'Mold updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMold = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await moldsService.deleteMold(id);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const createMaintenance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const maintenance = await moldsService.createMaintenance(req.body);

    res.status(201).json({
      success: true,
      data: maintenance,
      message: 'Maintenance record created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters = {
      ...parsePaginationParams(req.query),
      moldId: req.query.moldId as string | undefined,
      maintenanceType: req.query.maintenanceType as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const result = await moldsService.getMaintenanceHistory(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schedule = await moldsService.getMaintenanceSchedule();

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

export const recordUsage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const usage = await moldsService.recordUsage(req.body);

    res.status(201).json({
      success: true,
      data: usage,
      message: 'Mold usage recorded successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getUsageHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters = {
      ...parsePaginationParams(req.query),
      moldId: req.query.moldId as string | undefined,
      workOrderId: req.query.workOrderId as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const result = await moldsService.getUsageHistory(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await moldsService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getMoldUtilization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { moldId } = req.params;
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);

    const utilization = await moldsService.getMoldUtilization(moldId, startDate, endDate);

    res.json({
      success: true,
      data: utilization,
    });
  } catch (error) {
    next(error);
  }
};