// ============================================
// QUALITY CONTROL CONTROLLER
// backend/src/modules/quality/quality.controller.ts
// ============================================

import { Request, Response, NextFunction } from 'express';
import qualityService from './quality.service';
import { parsePaginationParams } from '@shared/utils/helpers';

// Measurements
export const getQualityMeasurements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      ...parsePaginationParams(req.query),
      workOrderId: req.query.workOrderId as string | undefined,
      measuredBy: req.query.measuredBy as string | undefined,
      overallResult: req.query.overallResult as 'PASS' | 'FAIL' | 'CONDITIONAL' | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const result = await qualityService.getQualityMeasurements(filters, req.user?.languagePreference || 'tr');

    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

export const getMeasurementById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const measurement = await qualityService.getMeasurementById(id, req.user?.languagePreference || 'tr');
    res.json({ success: true, data: measurement });
  } catch (error) {
    next(error);
  }
};

export const createQualityMeasurement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const measurement = await qualityService.createQualityMeasurement(req.body);
    res.status(201).json({ success: true, data: measurement, message: 'Quality measurement created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateQualityMeasurement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const measurement = await qualityService.updateQualityMeasurement(id, req.body);
    res.json({ success: true, data: measurement, message: 'Quality measurement updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Inspections
export const getFinalInspections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      ...parsePaginationParams(req.query),
      lotId: req.query.lotId as string | undefined,
      workOrderId: req.query.workOrderId as string | undefined,
      inspectedBy: req.query.inspectedBy as string | undefined,
      overallResult: req.query.overallResult as 'APPROVED' | 'REJECTED' | 'CONDITIONAL' | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const result = await qualityService.getFinalInspections(filters, req.user?.languagePreference || 'tr');

    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

export const getInspectionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const inspection = await qualityService.getInspectionById(id, req.user?.languagePreference || 'tr');
    res.json({ success: true, data: inspection });
  } catch (error) {
    next(error);
  }
};

export const createFinalInspection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inspection = await qualityService.createFinalInspection(req.body);
    res.status(201).json({ success: true, data: inspection, message: 'Final inspection created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateFinalInspection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const inspection = await qualityService.updateFinalInspection(id, req.body);
    res.json({ success: true, data: inspection, message: 'Final inspection updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Defects
export const getDefects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      ...parsePaginationParams(req.query),
      defectType: req.query.defectType as string | undefined,
      severity: req.query.severity as 'MINOR' | 'MAJOR' | 'CRITICAL' | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const result = await qualityService.getDefects(filters);

    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

// Reports
export const getQualityStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await qualityService.getQualityStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getDefectAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);
    
    const analysis = await qualityService.getDefectAnalysis(startDate, endDate);
    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
};
