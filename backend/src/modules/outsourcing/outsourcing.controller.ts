import { Request, Response, NextFunction } from 'express';
import outsourcingService from './outsourcing.service';
import { parsePaginationParams } from '@shared/utils/helpers';

export const getOutsourcingJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = {
      ...parsePaginationParams(req.query),
      status: req.query.status as string | undefined,
      supplierId: req.query.supplierId as string | undefined,
    };

    const result = await outsourcingService.getOutsourcingJobs(params);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getOutsourcingJobById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const job = await outsourcingService.getOutsourcingJobById(id);

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

export const createOutsourcingJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const job = await outsourcingService.createOutsourcingJob(req.body, req.user!.id);

    res.status(201).json({
      success: true,
      data: job,
      message: 'Outsourcing job created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateOutsourcingJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const job = await outsourcingService.updateOutsourcingJob(id, req.body);

    res.json({
      success: true,
      data: job,
      message: 'Outsourcing job updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const startJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const job = await outsourcingService.startJob(id);

    res.json({
      success: true,
      data: job,
      message: 'Job started',
    });
  } catch (error) {
    next(error);
  }
};

export const completeJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { receivedQuantity } = req.body;

    const job = await outsourcingService.completeJob(id, receivedQuantity);

    res.json({
      success: true,
      data: job,
      message: 'Job completed',
    });
  } catch (error) {
    next(error);
  }
};

export const cancelJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const job = await outsourcingService.cancelJob(id, reason);

    res.json({
      success: true,
      data: job,
      message: 'Job cancelled',
    });
  } catch (error) {
    next(error);
  }
};

export const getOutsourcingStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await outsourcingService.getOutsourcingStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getJobsBySupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { supplierId } = req.params;
    const jobs = await outsourcingService.getJobsBySupplier(supplierId);

    res.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};