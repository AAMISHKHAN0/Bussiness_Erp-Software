import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../../services/customerService';
import { ApiError } from '../../utils/ApiError';
import { validateRequired } from '../../utils/validators';

export class CustomerController {
    /**
     * GET /api/v1/customers
     * Get all active customers
     */
    static async getCustomers(req: Request, res: Response, next: NextFunction) {
        try {
            const { search } = req.query;
            const customers = await CustomerService.getCustomers(req.tenantDb!, { search: search as string });
            res.json({ success: true, count: customers.length, data: customers });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/customers/:id
     * Get a single customer
     */
    static async getCustomerById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const customer = await CustomerService.getCustomerById(req.tenantDb!, id as string);
            res.json({ success: true, data: customer });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/customers
     * Create a new customer
     */
    static async createCustomer(req: Request, res: Response, next: NextFunction) {
        try {
            const required = validateRequired(req.body, ['name']);
            if (!required.valid) {
                throw ApiError.badRequest(`Missing required fields: ${required.missing.join(', ')}`);
            }

            const newCustomer = await CustomerService.createCustomer(req.tenantDb!, req.body);
            res.status(201).json({
                success: true,
                message: 'Customer created successfully',
                data: newCustomer
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/v1/customers/:id
     * Soft delete customer
     */
    static async deleteCustomer(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await CustomerService.deleteCustomer(req.tenantDb!, id as string);
            res.json({
                success: true,
                message: 'Customer deleted successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}
