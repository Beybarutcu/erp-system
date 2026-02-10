import { Request, Response, NextFunction } from 'express';
import productsService from './products.service';
import { parsePaginationParams } from '@shared/utils/helpers';

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params = {
      ...parsePaginationParams(req.query),
      type: req.query.type as string | undefined,
      isStocked: req.query.isStocked === 'true' ? true : req.query.isStocked === 'false' ? false : undefined,
      search: req.query.search as string | undefined,
    };

    const result = await productsService.getProducts(
      params,
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

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const product = await productsService.getProductById(
      id,
      req.user?.languagePreference || 'tr'
    );

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await productsService.createProduct(
      req.body,
      req.user!.id
    );

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const product = await productsService.updateProduct(id, req.body);

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await productsService.deleteProduct(id);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const stock = await productsService.getProductStock(id);

    res.json({
      success: true,
      data: stock,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductUsage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const usage = await productsService.getProductUsage(id);

    res.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductsByType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type } = req.params;
    const products = await productsService.getProductsByType(
      type,
      req.user?.languagePreference || 'tr'
    );

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const searchProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q } = req.query;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    if (!q) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const products = await productsService.searchProducts(
      q as string,
      req.user?.languagePreference || 'tr',
      limit
    );

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkImportProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Products array is required',
      });
    }

    const results = await productsService.bulkImportProducts(
      products,
      req.user!.id
    );

    res.json({
      success: true,
      data: results,
      message: `Import completed: ${results.success} success, ${results.failed} failed`,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductTypesSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const summary = await productsService.getProductTypesSummary();

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
