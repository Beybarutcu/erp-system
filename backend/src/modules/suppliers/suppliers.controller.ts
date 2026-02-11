import { Request, Response, NextFunction } from 'express';
import suppliersService from './suppliers.service';
import { parsePaginationParams } from '@shared/utils/helpers';

export const getSuppliers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = {
      ...parsePaginationParams(req.query),
      type: req.query.type as string | undefined,
      search: req.query.search as string | undefined,
    };

    const result = await suppliersService.getSuppliers(params);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getSupplierById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const supplier = await suppliersService.getSupplierById(id);

    res.json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const supplier = await suppliersService.createSupplier(req.body);

    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const supplier = await suppliersService.updateSupplier(id, req.body);

    res.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await suppliersService.deleteSupplier(id);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const getSupplierStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const stats = await suppliersService.getSupplierStats(id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const searchSuppliers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q, type } = req.query;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    if (!q) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const suppliers = await suppliersService.searchSuppliers(
      q as string,
      type as string | undefined,
      limit
    );

    res.json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    next(error);
  }
};

export const getSuppliersByType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type } = req.params;
    const suppliers = await suppliersService.getSuppliersByType(type);

    res.json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    next(error);
  }
};