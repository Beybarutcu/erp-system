// Helper utility functions for ERP System

import { Decimal } from '@prisma/client/runtime/library';
import { PaginationParams, PaginatedResponse } from '@shared/types';

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number = 1,
  limit: number = 50
) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    page: Number(page),
    limit: Number(limit),
    pages: totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  return {
    data,
    pagination: calculatePagination(
      total,
      params.page || 1,
      params.limit || 50
    ),
  };
}

/**
 * Parse pagination params from query
 */
export function parsePaginationParams(query: any): PaginationParams {
  return {
    page: query.page ? parseInt(query.page) : 1,
    limit: query.limit ? Math.min(parseInt(query.limit), 100) : 50,
    sortBy: query.sortBy || 'createdAt',
    sortOrder: query.sortOrder === 'asc' ? 'asc' : 'desc',
  };
}

/**
 * Convert Decimal to number safely
 */
export function decimalToNumber(value: Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return value.toNumber();
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100; // 2 decimal places
}

/**
 * Format date to ISO string
 */
export function formatDateISO(date: Date | string): string {
  return new Date(date).toISOString();
}

/**
 * Get date range for queries
 */
export function getDateRange(period: 'today' | 'week' | 'month' | 'year') {
  const now = new Date();
  const startDate = new Date(now);
  
  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  return {
    startDate,
    endDate: now,
  };
}

/**
 * Calculate days between dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

/**
 * Generate unique code
 */
export function generateCode(prefix: string, date?: Date): string {
  const now = date || new Date();
  const timestamp = now.getTime();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate lot number
 */
export function generateLotNumber(productCode: string, sequence: number): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const seqStr = String(sequence).padStart(3, '0');
  return `${productCode}-${dateStr}-${seqStr}`;
}

/**
 * Validate UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize string for SQL
 */
export function sanitizeString(str: string): string {
  return str.trim().replace(/[^\w\s-]/gi, '');
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Remove undefined/null values from object
 */
export function removeEmpty<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined)
  ) as Partial<T>;
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Calculate work order completion percentage
 */
export function calculateProgress(
  planned: number,
  produced: number,
  scrap: number = 0
): number {
  if (planned === 0) return 0;
  return calculatePercentage(produced + scrap, planned);
}

/**
 * Calculate FIFO cost
 */
export function calculateFIFOCost(
  allocations: Array<{ quantity: number; unitCost: number }>
): number {
  return allocations.reduce((total, alloc) => {
    return total + (alloc.quantity * alloc.unitCost);
  }, 0);
}

/**
 * Format currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'TRY',
  locale: string = 'tr-TR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Calculate utilization rate
 */
export function calculateUtilization(
  used: number,
  available: number
): number {
  if (available === 0) return 0;
  return calculatePercentage(used, available);
}

/**
 * Determine utilization status
 */
export function getUtilizationStatus(
  rate: number
): 'AVAILABLE' | 'BUSY' | 'CRITICAL' | 'OVERLOADED' {
  if (rate > 100) return 'OVERLOADED';
  if (rate > 85) return 'CRITICAL';
  if (rate > 70) return 'BUSY';
  return 'AVAILABLE';
}

/**
 * Sleep utility for testing/delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry async function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await sleep(delay * attempt);
      }
    }
  }
  
  throw lastError!;
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Get unique values from array
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Calculate average
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

/**
 * Calculate sum
 */
export function sum(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0);
}

/**
 * Find min value
 */
export function min(numbers: number[]): number {
  return Math.min(...numbers);
}

/**
 * Find max value
 */
export function max(numbers: number[]): number {
  return Math.max(...numbers);
}

export default {
  calculatePagination,
  createPaginatedResponse,
  parsePaginationParams,
  decimalToNumber,
  calculatePercentage,
  formatDateISO,
  getDateRange,
  daysBetween,
  generateCode,
  generateLotNumber,
  isValidUUID,
  sanitizeString,
  deepClone,
  removeEmpty,
  groupBy,
  calculateProgress,
  calculateFIFOCost,
  formatCurrency,
  formatNumber,
  calculateUtilization,
  getUtilizationStatus,
  sleep,
  retry,
  chunk,
  unique,
  average,
  sum,
  min,
  max,
};
