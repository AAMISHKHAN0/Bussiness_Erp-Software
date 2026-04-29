import { Request, Response, NextFunction } from 'express';
import { SupplierService } from '../../services/supplierService';
import { ApiError } from '../../utils/ApiError';
import { validateRequired } from '../../utils/validators';

export class SupplierController {
    /**
     * GET /api/v1/suppliers
     * Get all active suppliers
     */
    static async getSuppliers(req: Request, res: Response, next: NextFunction) {
        try {
            const { search } = req.query;
            const suppliers = await SupplierService.getSuppliers(req.tenantDb!, { search: search as string });
            res.json({ success: true, count: suppliers.length, data: suppliers });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/suppliers/:id
     * Get a single supplier
     */
    static async getSupplierById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const supplier = await SupplierService.getSupplierById(req.tenantDb!, id as string);
            res.json({ success: true, data: supplier });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/suppliers
     * Create a new supplier
     */
    static async createSupplier(req: Request, res: Response, next: NextFunction) {
        try {
            const required = validateRequired(req.body, ['name']);
            if (!required.valid) {
                throw ApiError.badRequest(`Missing required fields: ${required.missing.join(', ')}`);
            }

            const newSupplier = await SupplierService.createSupplier(req.tenantDb!, req.body);
            res.status(201).json({
                success: true,
                message: 'Supplier created successfully',
                data: newSupplier
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/v1/suppliers/:id
     * Soft delete supplier
     */
    static async deleteSupplier(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await SupplierService.deleteSupplier(req.tenantDb!, id as string);
            res.json({
                success: true,
                message: 'Supplier deleted successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}
