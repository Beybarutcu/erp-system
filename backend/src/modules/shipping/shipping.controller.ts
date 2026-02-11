import { Request, Response, NextFunction } from 'express';
import shippingService from './shipping.service';
import { parsePaginationParams } from '@shared/utils/helpers';

export const getShipments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = {
      ...parsePaginationParams(req.query),
      status: req.query.status as string | undefined,
      orderId: req.query.orderId as string | undefined,
    };

    const result = await shippingService.getShipments(params);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getShipmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const shipment = await shippingService.getShipmentById(id);

    res.json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    next(error);
  }
};

export const createShipment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shipment = await shippingService.createShipment(req.body, req.user!.id);

    res.status(201).json({
      success: true,
      data: shipment,
      message: 'Shipment created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateShipment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const shipment = await shippingService.updateShipment(id, req.body);

    res.json({
      success: true,
      data: shipment,
      message: 'Shipment updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const markAsShipped = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const shipment = await shippingService.markAsShipped(id);

    res.json({
      success: true,
      data: shipment,
      message: 'Shipment marked as shipped',
    });
  } catch (error) {
    next(error);
  }
};

export const markAsDelivered = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const shipment = await shippingService.markAsDelivered(id);

    res.json({
      success: true,
      data: shipment,
      message: 'Shipment marked as delivered',
    });
  } catch (error) {
    next(error);
  }
};

export const cancelShipment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const shipment = await shippingService.cancelShipment(id, reason);

    res.json({
      success: true,
      data: shipment,
      message: 'Shipment cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getShipmentStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await shippingService.getShipmentStats(
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