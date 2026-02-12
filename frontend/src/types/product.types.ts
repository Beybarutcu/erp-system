import { BaseEntity } from "./common.types";

export interface Product extends BaseEntity {
  name: string;
  sku: string;
  description?: string;
  category: ProductCategory;
  unit: ProductUnit;
  minStockLevel?: number;
  reorderPoint?: number;
  currentStock: number;
  status: ProductStatus;
  imageUrl?: string;
}

export type ProductCategory =
  | "raw-material"
  | "semi-finished"
  | "finished-product"
  | "packaging"
  | "component";

export type ProductUnit =
  | "pieces"
  | "kg"
  | "liters"
  | "meters"
  | "boxes"
  | "pallets";

export type ProductStatus = "active" | "inactive" | "discontinued";

export interface CreateProductDto {
  name: string;
  sku: string;
  description?: string;
  category: ProductCategory;
  unit: ProductUnit;
  minStockLevel?: number;
  reorderPoint?: number;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  id: string;
}

export interface ProductFilters {
  search?: string;
  category?: ProductCategory;
  status?: ProductStatus;
}
