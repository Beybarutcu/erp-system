// ============================================
// WAREHOUSE CONTROLLER
// backend/src/modules/warehouse/warehouse.controller.ts
// ============================================

import { Request, Response, NextFunction } from 'express';
import warehouseService from './warehouse.service';
import { parsePaginationParams } from '@shared/utils/helpers';

// ============================================
// WAREHOUSES
// ============================================

export const getWarehouses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters = {
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      search: req.query.search as string | undefined,
    };

    const warehouses = await warehouseService.getWarehouses(filters);

    res.json({
      success: true,
      data: warehouses,
    });
  } catch (error) {
    next(error);
  }
};

export const getWarehouseById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const warehouse = await warehouseService.getWarehouseById(id);

    res.json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
};

export const createWarehouse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const warehouse = await warehouseService.createWarehouse(req.body);

    res.status(201).json({
      success: true,
      data: warehouse,
      message: 'Warehouse created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateWarehouse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const warehouse = await warehouseService.updateWarehouse(id, req.body);

    res.json({
      success: true,
      data: warehouse,
      message: 'Warehouse updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWarehouse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await warehouseService.deleteWarehouse(id);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ZONES
// ============================================

export const getZones = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const warehouseId = req.query.warehouseId as string | undefined;
    const zones = await warehouseService.getZones(warehouseId);

    res.json({
      success: true,
      data: zones,
    });
  } catch (error) {
    next(error);
  }
};

export const createZone = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const zone = await warehouseService.createZone(req.body);

    res.status(201).json({
      success: true,
      data: zone,
      message: 'Zone created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// LOCATIONS
// ============================================

export const getLocations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters = {
      ...parsePaginationParams(req.query),
      warehouseId: req.query.warehouseId as string | undefined,
      zoneId: req.query.zoneId as string | undefined,
      locationType: req.query.locationType as string | undefined,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      hasSpace: req.query.hasSpace === 'true',
      search: req.query.search as string | undefined,
    };

    const result = await warehouseService.getLocations(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getLocationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const location = await warehouseService.getLocationById(id);

    res.json({
      success: true,
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

export const createLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const location = await warehouseService.createLocation(req.body);

    res.status(201).json({
      success: true,
      data: location,
      message: 'Location created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const location = await warehouseService.updateLocation(id, req.body);

    res.json({
      success: true,
      data: location,
      message: 'Location updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// TRANSFERS
// ============================================

export const transferLot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const transferData = {
      ...req.body,
      userId: req.user!.id,
    };

    const transfer = await warehouseService.transferLot(transferData);

    res.status(201).json({
      success: true,
      data: transfer,
      message: 'Lot transferred successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getTransfers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters = {
      ...parsePaginationParams(req.query),
      lotId: req.query.lotId as string | undefined,
      fromLocationId: req.query.fromLocationId as string | undefined,
      toLocationId: req.query.toLocationId as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const result = await warehouseService.getTransfers(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// REPORTS
// ============================================

export const getOccupancyReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { warehouseId } = req.params;
    const report = await warehouseService.getOccupancyReport(warehouseId);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailableLocations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { warehouseId } = req.params;
    const requiredSpace = parseFloat(req.query.requiredSpace as string) || 0;

    const locations = await warehouseService.getAvailableLocations(
      warehouseId,
      requiredSpace
    );

    res.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    next(error);
  }
};