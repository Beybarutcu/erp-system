import { Request, Response, NextFunction } from 'express';
import { prisma } from '@shared/database/client';
import { logger } from '@shared/utils/logger';

/**
 * Audit log middleware - logs all state-changing operations
 */
export const auditLog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Only log state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Store original send function
  const originalSend = res.send;

  // Override send to capture response
  res.send = function (data: any): Response {
    res.send = originalSend; // Restore original

    // Try to parse response
    let responseData: any;
    try {
      responseData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
      responseData = null;
    }

    // Log to database asynchronously (don't block response)
    if (res.statusCode < 400 && req.user) {
      logAudit(req, responseData).catch(error => {
        logger.error('Audit log error:', error);
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

async function logAudit(req: Request, responseData: any) {
  try {
    // Extract table name and record ID from URL
    const urlParts = req.url.split('/');
    const tableName = urlParts[2] || 'unknown'; // e.g., /api/products -> products
    
    let recordId: string | null = null;
    let action: string;
    let newValues: any = null;

    // Determine action and record ID
    switch (req.method) {
      case 'POST':
        action = 'CREATE';
        recordId = responseData?.data?.id || null;
        newValues = req.body;
        break;
      
      case 'PUT':
      case 'PATCH':
        action = 'UPDATE';
        recordId = req.params.id || urlParts[3] || null;
        newValues = req.body;
        break;
      
      case 'DELETE':
        action = 'DELETE';
        recordId = req.params.id || urlParts[3] || null;
        break;
      
      default:
        return;
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        tableName: sanitizeTableName(tableName),
        recordId,
        action,
        oldValues: null, // Could fetch old values before update if needed
        newValues: newValues || null,
        ipAddress: req.ip || req.connection.remoteAddress || null,
      },
    });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
    // Don't throw - audit logging shouldn't break the request
  }
}

function sanitizeTableName(name: string): string {
  // Convert plural API names to singular table names
  const mapping: Record<string, string> = {
    'products': 'products',
    'bom': 'bom_items',
    'inventory': 'inventory_lots',
    'work-orders': 'work_orders',
    'machines': 'machines',
    'orders': 'orders',
    'customers': 'customers',
    'suppliers': 'suppliers',
    'users': 'users',
  };

  return mapping[name] || name;
}

/**
 * Get audit logs for a specific record
 */
export async function getAuditLogs(tableName: string, recordId: string) {
  return await prisma.auditLog.findMany({
    where: {
      tableName,
      recordId,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(userId: string, limit: number = 50) {
  return await prisma.auditLog.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Clean old audit logs (for maintenance)
 */
export async function cleanOldAuditLogs(daysToKeep: number = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  logger.info(`Cleaned ${result.count} old audit logs`);
  return result.count;
}
