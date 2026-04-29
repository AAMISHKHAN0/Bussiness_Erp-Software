import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../../services/productService';
import { ApiError } from '../../utils/ApiError';
import { validateRequired } from '../../utils/validators';
import { requireAuthUser } from '../../utils/requestUser';

export class ProductController {
    /**
     * GET /api/v1/products
     * Get all products with filters
     */
    static async getProducts(req: Request, res: Response, next: NextFunction) {
        try {
            const { category_id, search } = req.query;
            const products = await ProductService.getAllProducts(req.tenantDb!, { 
                category_id: category_id as string, 
                search: search as string 
            });
            res.json({ success: true, count: products.length, data: products });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/products/:id
     * Get a single product
     */
    static async getProductById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const product = await ProductService.getProductById(req.tenantDb!, id as string);
            res.json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/products
     * Create a new product
     */
    static async createProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const required = validateRequired(req.body, ['name', 'base_price']);
            if (!required.valid) {
                throw ApiError.badRequest(`Missing required fields: ${required.missing.join(', ')}`);
            }

            const { branchId } = requireAuthUser(req);
            const newProduct = await ProductService.createProduct(req.tenantDb!, req.body, branchId || null);

            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: newProduct
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/v1/products/:id
     * Update an existing product
     */
    static async updateProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const required = validateRequired(req.body, ['name', 'base_price']);
            if (!required.valid) {
                throw ApiError.badRequest(`Missing required fields: ${required.missing.join(', ')}`);
            }

            const { branchId } = requireAuthUser(req);
            const updated = await ProductService.updateProduct(req.tenantDb!, id as string, req.body, branchId || null);

            res.json({
                success: true,
                message: 'Product updated successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/v1/products/:id
     * Soft-delete a product
     */
    static async deleteProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await ProductService.deleteProduct(req.tenantDb!, id as string);
            res.json({
                success: true,
                message: 'Product deleted successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}
