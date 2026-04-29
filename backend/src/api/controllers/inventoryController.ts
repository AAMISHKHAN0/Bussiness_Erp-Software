import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../../services/inventoryService';
import { ApiError } from '../../utils/ApiError';
import { validateRequired } from '../../utils/validators';
import { requireAuthUser } from '../../utils/requestUser';

export class InventoryController {
    /**
     * GET /api/v1/inventory
     * Get stock levels with filters
     */
    static async getInventory(req: Request, res: Response, next: NextFunction) {
        try {
            const { branch_id, product_id } = req.query;
            const inventory = await InventoryService.getInventory(req.tenantDb!, { 
                branch_id: branch_id as string, 
                product_id: product_id as string 
            });
            res.json({ success: true, count: inventory.length, data: inventory });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/inventory/movement
     * Record a stock movement (IN, OUT, TRANSFER, ADJUSTMENT)
     */
    static async recordMovement(req: Request, res: Response, next: NextFunction) {
        try {
            const required = validateRequired(req.body, ['product_id', 'branch_id', 'movement_type', 'quantity']);
            if (!required.valid) {
                throw ApiError.badRequest(`Missing required fields: ${required.missing.join(', ')}`);
            }

            const created_by = requireAuthUser(req).id;
            const result = await InventoryService.recordMovement(req.tenantDb!, {
                ...req.body,
                created_by
            });

            res.status(201).json({
                success: true,
                message: 'Stock movement recorded successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}
