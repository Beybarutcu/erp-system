// Constants for ERP System

export const APP_CONFIG = {
  APP_NAME: 'Plastic Injection ERP',
  VERSION: '1.0.0',
  API_PREFIX: '/api',
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
};

export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '24h',
  REFRESH_TOKEN_EXPIRY: '7d',
  ALGORITHM: 'HS256' as const,
};

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  AUTH_MAX_REQUESTS: 5,
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
};

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

export const INVENTORY = {
  DEFAULT_FIFO: true,
  AGING_THRESHOLD_DAYS: 90,
  CRITICAL_AGING_DAYS: 180,
  LOW_STOCK_THRESHOLD: 10,
};

export const WORK_ORDER = {
  DEFAULT_PRIORITY: 5,
  MIN_PRIORITY: 1,
  MAX_PRIORITY: 10,
};

export const MACHINE = {
  DEFAULT_CAPACITY_PER_HOUR: 100,
  UTILIZATION_THRESHOLDS: {
    AVAILABLE: 70,
    BUSY: 85,
    CRITICAL: 100,
  },
};

export const NOTIFICATION_TYPES = {
  CAPACITY_WARNING: 'CAPACITY_WARNING',
  STOCK_LOW: 'STOCK_LOW',
  STOCK_AGING: 'STOCK_AGING',
  DEADLINE_RISK: 'DEADLINE_RISK',
  WORK_ORDER_STARTED: 'WORK_ORDER_STARTED',
  WORK_ORDER_COMPLETED: 'WORK_ORDER_COMPLETED',
  MACHINE_BREAKDOWN: 'MACHINE_BREAKDOWN',
  ORDER_CREATED: 'ORDER_CREATED',
  SHIPMENT_READY: 'SHIPMENT_READY',
} as const;

export const WEBSOCKET_EVENTS = {
  WORK_ORDER_STARTED: 'work-order:started',
  WORK_ORDER_UPDATED: 'work-order:updated',
  WORK_ORDER_COMPLETED: 'work-order:completed',
  MACHINE_STATUS_CHANGED: 'machine:status-changed',
  INVENTORY_LOW_STOCK: 'inventory:low-stock',
  NOTIFICATION_NEW: 'notification:new',
  ORDER_STATUS_CHANGED: 'order:status-changed',
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden - Insufficient permissions',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  INSUFFICIENT_STOCK: 'Insufficient stock',
  CIRCULAR_DEPENDENCY: 'Circular BOM dependency detected',
  INVALID_CREDENTIALS: 'Invalid credentials',
  TOKEN_EXPIRED: 'Token expired',
  DUPLICATE_ENTRY: 'Duplicate entry',
} as const;

export const SUCCESS_MESSAGES = {
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
} as const;

// Language codes
export const LANGUAGES = {
  TR: 'tr',
  EN: 'en',
} as const;

export const DEFAULT_LANGUAGE = LANGUAGES.TR;

// Helper function to get supported languages
export const getSupportedLanguages = () => Object.values(LANGUAGES);

// Helper function to validate language
export const isValidLanguage = (lang: string): boolean => {
  return Object.values(LANGUAGES).includes(lang as any);
};
