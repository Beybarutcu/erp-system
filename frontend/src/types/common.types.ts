/**
 * Common types used across the application
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type Status = "active" | "inactive" | "pending" | "archived";

export interface FilterParams {
  search?: string;
  status?: Status;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
