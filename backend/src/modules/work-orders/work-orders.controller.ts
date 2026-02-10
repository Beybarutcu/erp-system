import { Request, Response, NextFunction } from 'express';
import workOrdersService from './work-orders.service';
import { parsePaginationParams } from '@shared/utils/helpers';

export const getWorkOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = {
      ...parsePaginationParams(req.query),
      status: req.query.status as any,
      machineId: req.query.machineId as string,
      productId: req.query.productId as string,
      orderId: req.query.orderId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const result = await workOrdersService.getWorkOrders(
      params,
      req.user?.languagePreference || 'tr'
    );

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const workOrder = await workOrdersService.getWorkOrderById(
      id,
      req.user?.languagePreference || 'tr'
    );

    res.json({
      success: true,
      data: workOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const createWorkOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workOrder = await workOrdersService.createWorkOrder(
      req.body,
      req.user!.id
    );

    res.status(201).json({
      success: true,
      data: workOrder,
      message: 'Work order created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const startWorkOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const workOrder = await workOrdersService.startWorkOrder(
      id,
      req.body,
      req.user!.id
    );

    res.json({
      success: true,
      data: workOrder,
      message: 'Work order started',
    });
  } catch (error) {
    next(error);
  }
};

export const recordProduction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const workOrder = await workOrdersService.recordProduction(
      id,
      req.body,
      req.user!.id
    );

    res.json({
      success: true,
      data: workOrder,
      message: 'Production recorded successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const pauseWorkOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const workOrder = await workOrdersService.pauseWorkOrder(id, reason);

    res.json({
      success: true,
      data: workOrder,
      message: 'Work order paused',
    });
  } catch (error) {
    next(error);
  }
};

export const resumeWorkOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const workOrder = await workOrdersService.resumeWorkOrder(id);

    res.json({
      success: true,
      data: workOrder,
      message: 'Work order resumed',
    });
  } catch (error) {
    next(error);
  }
};

export const completeWorkOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const workOrder = await workOrdersService.completeWorkOrder(id);

    res.json({
      success: true,
      data: workOrder,
      message: 'Work order completed',
    });
  } catch (error) {
    next(error);
  }
};

export const cancelWorkOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required',
      });
    }

    const workOrder = await workOrdersService.cancelWorkOrder(id, reason);

    res.json({
      success: true,
      data: workOrder,
      message: 'Work order cancelled',
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkOrderTimeline = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const timeline = await workOrdersService.getWorkOrderTimeline(id);

    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
};

export const getMaterialUsage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const materials = await workOrdersService.getMaterialUsage(id);

    res.json({
      success: true,
      data: materials,
    });
  } catch (error) {
    next(error);
  }
};
