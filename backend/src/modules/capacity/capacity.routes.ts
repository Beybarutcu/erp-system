// ============================================
// CAPACITY CONTROLLER
// ============================================

import { Request, Response, NextFunction } from 'express';
import capacityService from './capacity.service';

export const getCapacityOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    const overview = await capacityService.getCapacityOverview(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
};

export const calculateCapacityForWorkOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await capacityService.calculateCapacityForWorkOrder(req.body);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const optimizeSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workOrderIds, optimizationGoal } = req.body;

    if (!Array.isArray(workOrderIds) || workOrderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Work order IDs array is required',
      });
    }

    const result = await capacityService.optimizeSchedule(
      workOrderIds,
      optimizationGoal
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getCapacityForecast = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    const forecast = await capacityService.getCapacityForecast(days);

    res.json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    next(error);
  }
};

export const checkOrderFulfillment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;

    const result = await capacityService.checkOrderFulfillment(orderId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CAPACITY ROUTES
// ============================================

import { Router } from 'express';
import { authenticate, checkPermission } from '@shared/middleware/auth';
import { validateUUID } from '@shared/middleware/validation';

const router = Router();

router.use(authenticate);

// Get capacity overview
router.get(
  '/overview',
  checkPermission('capacity', 'view'),
  getCapacityOverview
);

// Get capacity forecast
router.get(
  '/forecast',
  checkPermission('capacity', 'view'),
  getCapacityForecast
);

// Calculate capacity for work order
router.post(
  '/calculate',
  checkPermission('capacity', 'view'),
  calculateCapacityForWorkOrder
);

// Optimize schedule
router.post(
  '/optimize',
  checkPermission('capacity', 'edit'),
  optimizeSchedule
);

// Check order fulfillment
router.get(
  '/orders/:orderId/check-fulfillment',
  checkPermission('capacity', 'view'),
  validateUUID('orderId'),
  checkOrderFulfillment
);

export default router;
