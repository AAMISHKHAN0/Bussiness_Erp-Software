import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../../services/categoryService';
import { ApiError } from '../../utils/ApiError';
import { validateRequired } from '../../utils/validators';

export class CategoryController {
    /**
     * GET /api/v1/categories
     * Get all active categories
     */
    static async getCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const categories = await CategoryService.getActiveCategories(req.tenantDb!);
            res.json({ success: true, count: categories.length, data: categories });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/categories
     * Create a new category 
     */
    static async createCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, description, parent_id, is_active } = req.body;

            const required = validateRequired(req.body, ['name']);
            if (!required.valid) {
                throw ApiError.badRequest(`Missing required fields: ${required.missing.join(', ')}`);
            }

            const newCategory = await CategoryService.createCategory(req.tenantDb!, { name, description, parent_id, is_active });
            res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: newCategory
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/v1/categories/:id
     * Update an existing category
     */
    static async updateCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { name, description, parent_id, is_active } = req.body;

            const required = validateRequired(req.body, ['name']);
            if (!required.valid) {
                throw ApiError.badRequest(`Missing required fields: ${required.missing.join(', ')}`);
            }

            const updated = await CategoryService.updateCategory(req.tenantDb!, id as string, { name, description, parent_id, is_active });
            res.json({
                success: true,
                message: 'Category updated successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/v1/categories/:id
     * Delete a category
     */
    static async deleteCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await CategoryService.deleteCategory(req.tenantDb!, id as string);
            res.json({
                success: true,
                message: 'Category deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}
