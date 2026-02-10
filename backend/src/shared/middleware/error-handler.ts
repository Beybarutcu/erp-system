import { Request, Response, NextFunction } from 'express';
import { logger } from '@shared/utils/logger';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: any = undefined;

  // Custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Prisma Errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    
    switch (err.code) {
      case 'P2002':
        message = 'Unique constraint violation';
        errors = { field: err.meta?.target };
        break;
      case 'P2025':
        message = 'Record not found';
        break;
      case 'P2003':
        message = 'Foreign key constraint violation';
        break;
      default:
        message = 'Database error';
    }
  }

  // Validation Errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  }

  // JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    statusCode,
  });

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
