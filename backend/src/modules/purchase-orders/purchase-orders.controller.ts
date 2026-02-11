// ============================================
// PURCHASE ORDERS CONTROLLER
// backend/src/modules/purchase-orders/purchase-orders.controller.ts
// ============================================

import { Request, Response, NextFunction } from 'express';
import purchaseOrdersService from './purchase-orders.service';
import { parsePaginationParams } from '@shared/utils/helpers';
import { PurchaseOrderStatus } from '@prisma/client';

// ============================================
// CRUD
// ============================================

export const getPurchaseOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters = {
      ...parsePaginationParams(req.query),
      supplierId: req.query.supplierId as string | undefined,
      status: req.query.status as PurchaseOrderStatus | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      search: req.query.search as string | undefined,
    };

    const result = await purchaseOrdersService.getPurchaseOrders(
      filters,
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

export const getPurchaseOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const purchaseOrder = await purchaseOrdersService.getPurchaseOrderById(
      id,
      req.user?.languagePreference || 'tr'
    );

    res.json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const createPurchaseOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const purchaseOrder = await purchaseOrdersService.createPurchaseOrder(req.body);

    res.status(201).json({
      success: true,
      data: purchaseOrder,
      message: 'Purchase order created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updatePurchaseOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const purchaseOrder = await purchaseOrdersService.updatePurchaseOrder(id, req.body);

    res.json({
      success: true,
      data: purchaseOrder,
      message: 'Purchase order updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deletePurchaseOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await purchaseOrdersService.deletePurchaseOrder(id);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// RECEIVE OPERATIONS
// ============================================

export const receivePurchaseOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = {
      ...req.body,
      userId: req.user!.id,
    };

    const result = await purchaseOrdersService.receivePurchaseOrder(data);

    res.json({
      success: true,
      data: result,
      message: 'Purchase order received successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CONFIRMATIONS
// ============================================

export const createConfirmation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const confirmation = await purchaseOrdersService.createConfirmation(req.body);

    res.status(201).json({
      success: true,
      data: confirmation,
      message: 'Confirmation created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getConfirmations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const purchaseOrderId = req.query.purchaseOrderId as string | undefined;
    const confirmations = await purchaseOrdersService.getConfirmations(purchaseOrderId);

    res.json({
      success: true,
      data: confirmations,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// REPORTS
// ============================================

export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await purchaseOrdersService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getSupplierHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { supplierId } = req.params;
    const history = await purchaseOrdersService.getSupplierHistory(supplierId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingReceiveReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const report = await purchaseOrdersService.getPendingReceiveReport();

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};