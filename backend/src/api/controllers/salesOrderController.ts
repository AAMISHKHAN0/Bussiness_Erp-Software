import { Request, Response, NextFunction } from 'express';
import { SalesOrderService } from '../../services/salesOrderService';
import { ApiError } from '../../utils/ApiError';
import { validateRequired } from '../../utils/validators';
import { requireAuthUser } from '../../utils/requestUser';

export class SalesOrderController {
    /**
     * GET /api/v1/sales/orders
     * Get all sales orders
     */
    static async getOrders(req: Request, res: Response, next: NextFunction) {
        try {
            const orders = await SalesOrderService.getAllOrders(req.tenantDb!);
            res.json({ success: true, count: orders.length, data: orders });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/sales/orders/:id
     * Get a single sales order
     */
    static async getOrderById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const order = await SalesOrderService.getOrderById(req.tenantDb!, id as string);
            res.json({ success: true, data: order });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/sales/orders
     * Create a new sales order with inventory deduction
     */
    static async createOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const required = validateRequired(req.body, ['customer_id', 'branch_id', 'items']);
            if (!required.valid) {
                throw ApiError.badRequest(`Missing required fields: ${required.missing.join(', ')}`);
            }

            const user_id = requireAuthUser(req).id;
            const newOrder = await SalesOrderService.createOrder(req.tenantDb!, req.body, user_id);

            res.status(201).json({
                success: true,
                message: 'Sales order created successfully',
                data: newOrder
            });
        } catch (error) {
            next(error);
        }
    }
}
