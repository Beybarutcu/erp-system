import { Request, Response, NextFunction } from 'express';
import reportingService from './reporting.service';

export const getProductionReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, productId, machineId, status } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    const report = await reportingService.getProductionReport({
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      productId: productId as string,
      machineId: machineId as string,
      status: status as string,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { lowStock, agingDays } = req.query;

    const report = await reportingService.getInventoryReport({
      lowStock: lowStock === 'true',
      agingDays: agingDays ? parseInt(agingDays as string) : undefined,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, customerId, status } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    const report = await reportingService.getSalesReport({
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      customerId: customerId as string,
      status: status as string,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const getMaterialConsumptionReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, productId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    const report = await reportingService.getMaterialConsumptionReport({
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      productId: productId as string,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const getMachineUtilizationReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, machineId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    const report = await reportingService.getMachineUtilizationReport({
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      machineId: machineId as string,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const getFinancialSummaryReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required',
      });
    }

    const report = await reportingService.getFinancialSummaryReport({
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};