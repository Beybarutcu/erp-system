import { Request, Response, NextFunction } from 'express';
import customersService from './customers.service';
import { parsePaginationParams } from '@shared/utils/helpers';

export const getCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = {
      ...parsePaginationParams(req.query),
      search: req.query.search as string | undefined,
    };

    const result = await customersService.getCustomers(params);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const customer = await customersService.getCustomerById(id);

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customer = await customersService.createCustomer(req.body);

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const customer = await customersService.updateCustomer(id, req.body);

    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await customersService.deleteCustomer(id);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const stats = await customersService.getCustomerStats(id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const searchCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q } = req.query;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    if (!q) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const customers = await customersService.searchCustomers(q as string, limit);

    res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};