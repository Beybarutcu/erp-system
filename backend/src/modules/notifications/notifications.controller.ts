import { Request, Response, NextFunction } from 'express';
import notificationsService from './notifications.service';
import { parsePaginationParams } from '@shared/utils/helpers';

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const params = {
      ...parsePaginationParams(req.query),
      isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
      type: req.query.type as string | undefined,
    };

    const result = await notificationsService.getNotifications(userId, params);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const count = await notificationsService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await notificationsService.markAsRead(id, userId);

    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const result = await notificationsService.markAllAsRead(userId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await notificationsService.deleteNotification(id, userId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const createSystemNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await notificationsService.createSystemNotification(req.body);

    res.json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};