import { prisma } from '@shared/database/client';
import { Prisma } from '@prisma/client';
import { AppError } from '@shared/middleware/error-handler';
import { cache } from '@shared/database/redis';
import { 
  PaginationParams, 
  PaginatedResponse 
} from '@shared/types';
import { 
  createPaginatedResponse,
  parsePaginationParams 
} from '@shared/utils/helpers';

export class CustomersService {
  /**
   * Get all customers with pagination
   */
  async getCustomers(
    params: PaginationParams & {
      search?: string;
    }
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 50, sortBy = 'name', sortOrder = 'asc', search } = params;

    const where: Prisma.CustomerWhereInput = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return createPaginatedResponse(customers, total, params);
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { orderDate: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    return customer;
  }

  /**
   * Create customer
   */
  async createCustomer(data: {
    code: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxNumber?: string;
    paymentTerms?: number;
  }) {
    // Check if code exists
    const existing = await prisma.customer.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new AppError('Customer code already exists', 400);
    }

    const customer = await prisma.customer.create({
      data,
    });

    await cache.deletePattern('customers:*');

    return customer;
  }

  /**
   * Update customer
   */
  async updateCustomer(
    id: string,
    data: {
      code?: string;
      name?: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      address?: string;
      taxNumber?: string;
      paymentTerms?: number;
    }
  ) {
    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Customer not found', 404);
    }

    // Check code uniqueness
    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.customer.findUnique({
        where: { code: data.code },
      });

      if (duplicate) {
        throw new AppError('Customer code already exists', 400);
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data,
    });

    await cache.deletePattern('customers:*');

    return customer;
  }

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    if (customer._count.orders > 0) {
      throw new AppError('Cannot delete customer with orders', 400);
    }

    await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });

    await cache.deletePattern('customers:*');

    return { message: 'Customer deleted successfully' };
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(id: string) {
    const [orderStats, recentOrders] = await Promise.all([
      prisma.order.aggregate({
        where: {
          customerId: id,
        },
        _count: true,
        _sum: {
          totalAmount: true,
        },
      }),

      prisma.order.findMany({
        where: { customerId: id },
        orderBy: { orderDate: 'desc' },
        take: 5,
        include: {
          items: true,
        },
      }),
    ]);

    return {
      totalOrders: orderStats._count,
      totalRevenue: orderStats._sum.totalAmount || 0,
      recentOrders,
    };
  }

  /**
   * Search customers
   */
  async searchCustomers(query: string, limit: number = 20) {
    return await prisma.customer.findMany({
      where: {
        isActive: true,
        OR: [
          { code: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { contactPerson: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
    });
  }
}

export default new CustomersService();