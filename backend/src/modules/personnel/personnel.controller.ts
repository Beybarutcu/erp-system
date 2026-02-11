// ============================================
// CONTROLLER - personnel.controller.ts
// ============================================

import { Request, Response, NextFunction } from 'express';
import personnelService from './personnel.service';
import { parsePaginationParams } from '@shared/utils/helpers';

export const getPersonnel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      ...parsePaginationParams(req.query),
      position: req.query.position as string | undefined,
      shift: req.query.shift as string | undefined,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      search: req.query.search as string | undefined,
    };

    const result = await personnelService.getPersonnel(filters);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

export const getPersonnelById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const personnel = await personnelService.getPersonnelById(id);
    res.json({ success: true, data: personnel });
  } catch (error) {
    next(error);
  }
};

export const createPersonnel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const personnel = await personnelService.createPersonnel(req.body);
    res.status(201).json({ success: true, data: personnel, message: 'Personnel created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updatePersonnel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const personnel = await personnelService.updatePersonnel(id, req.body);
    res.json({ success: true, data: personnel, message: 'Personnel updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deletePersonnel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await personnelService.deletePersonnel(id);
    res.json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

export const recordCapacity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const capacity = await personnelService.recordCapacity(req.body);
    res.status(201).json({ success: true, data: capacity, message: 'Capacity recorded successfully' });
  } catch (error) {
    next(error);
  }
};

export const getCapacityReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const weekNumber = parseInt(req.query.weekNumber as string);
    const year = parseInt(req.query.year as string);
    const report = await personnelService.getCapacityReport(weekNumber, year);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await personnelService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};