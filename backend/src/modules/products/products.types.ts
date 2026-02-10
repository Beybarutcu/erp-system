import { Product, ProductTranslation, ProductType } from '@prisma/client';

export interface ProductWithTranslations extends Product {
  translations: ProductTranslation[];
}

export interface ProductListItem extends Product {
  translations: ProductTranslation[];
  _count: {
    bomParent: number;
    inventoryLots: number;
  };
}

export interface ProductDetail extends Product {
  translations: ProductTranslation[];
  bomParent: any[];
  _count: {
    bomParent: number;
    bomChild: number;
    inventoryLots: number;
    workOrders: number;
  };
}

export interface ProductStockSummary {
  productId: string;
  productCode: string;
  totalQuantity: number;
  lotCount: number;
}

export interface ProductUsage {
  usedInBOMs: number;
  bomDetails: any[];
  totalWorkOrders: number;
  recentTransactions: number;
}

export interface BulkImportResult {
  success: number;
  failed: number;
  errors: Array<{
    code: string;
    error: string;
  }>;
}

export interface ProductTypeSummary {
  type: ProductType;
  count: number;
}

export interface CreateProductDTO {
  code: string;
  type: ProductType;
  isStocked?: boolean;
  translations: Array<{
    languageCode: string;
    name: string;
    description?: string;
    technicalSpecs?: any;
  }>;
}

export interface UpdateProductDTO {
  code?: string;
  type?: ProductType;
  isStocked?: boolean;
  translations?: Array<{
    languageCode: string;
    name: string;
    description?: string;
    technicalSpecs?: any;
  }>;
}

export interface ProductFilters {
  type?: ProductType;
  isStocked?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
