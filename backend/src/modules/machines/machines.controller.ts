import { Request, Response, NextFunction } from 'express';
import machinesService from './machines.service';
import { parsePaginationParams } from '@shared/utils/helpers';

export const getMachines = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = {
      ...parsePaginationParams(req.query),
      status: req.query.status as any,
      machineType: req.query.machineType as string,
      location: req.query.location as string,
    };

    const result = await machinesService.getMachines(
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

export const getMachineById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const machine = await machinesService.getMachineById(
      id,
      req.user?.languagePreference || 'tr'
    );

    res.json({
      success: true,
      data: machine,
    });
  } catch (error) {
    next(error);
  }
};

export const createMachine = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const machine = await machinesService.createMachine(req.body);

    res.status(201).json({
      success: true,
      data: machine,
      message: 'Machine created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateMachine = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const machine = await machinesService.updateMachine(id, req.body);

    res.json({
      success: true,
      data: machine,
      message: 'Machine updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMachine = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await machinesService.deleteMachine(id);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const getMachineSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    const schedule = await machinesService.getMachineSchedule(
      id,
      new Date(startDate as string),
      new Date(endDate as string),
      req.user?.languagePreference || 'tr'
    );

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

export const getMachineUtilization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    const utilization = await machinesService.getMachineUtilization(
      id,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: utilization,
    });
  } catch (error) {
    next(error);
  }
};

export const getUtilizationOverview = async (
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

    const overview = await machinesService.getUtilizationOverview(
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

export const scheduleMaintenance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const maintenance = await machinesService.scheduleMaintenance({
      machineId: id,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      data: maintenance,
      message: 'Maintenance scheduled successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const completeMaintenance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { maintenanceId } = req.params;
    const maintenance = await machinesService.completeMaintenance(maintenanceId);

    res.json({
      success: true,
      data: maintenance,
      message: 'Maintenance completed',
    });
  } catch (error) {
    next(error);
  }
};

export const updateShifts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { shifts } = req.body;

    if (!Array.isArray(shifts) || shifts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Shifts array is required',
      });
    }

    const result = await machinesService.updateShifts(id, shifts);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const getMachineTypesSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const summary = await machinesService.getMachineTypesSummary();

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

export const getMachinePerformance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    const performance = await machinesService.getMachinePerformance(
      id,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    next(error);
  }
};
