import { Request, Response, NextFunction } from 'express';
import ordersService from './orders.service';
import { parsePaginationParams } from '@shared/utils/helpers';

export const getOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = {
      ...parsePaginationParams(req.query),
      status: req.query.status as any,
      customerId: req.query.customerId as string | undefined,
      search: req.query.search as string | undefined,
    };

    const result = await ordersService.getOrders(params);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const order = await ordersService.getOrderById(id);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const order = await ordersService.createOrder(req.body, req.user!.id);

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const order = await ordersService.updateOrder(id, req.body);

    res.json({
      success: true,
      data: order,
      message: 'Order updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await ordersService.cancelOrder(id, reason);

    res.json({
      success: true,
      data: order,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const addOrderItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const item = await ordersService.addOrderItem(orderId, req.body);

    res.status(201).json({
      success: true,
      data: item,
      message: 'Item added to order',
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itemId } = req.params;
    const item = await ordersService.updateOrderItem(itemId, req.body);

    res.json({
      success: true,
      data: item,
      message: 'Order item updated',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOrderItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itemId } = req.params;
    const result = await ordersService.deleteOrderItem(itemId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await ordersService.getOrderStats(
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