import { Request, Response, NextFunction } from 'express';
import { PurchaseOrderService } from '../../services/purchaseOrderService';
import { requireAuthUser } from '../../utils/requestUser';

export class PurchaseOrderController {
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const rows = await PurchaseOrderService.list(req.tenantDb!);
            res.json({ success: true, count: rows.length, data: rows });
        } catch (e) {
            next(e);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await PurchaseOrderService.getById(req.tenantDb!, req.params.id as string);
            res.json({ success: true, data });
        } catch (e) {
            next(e);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: userId } = requireAuthUser(req);
            const data = await PurchaseOrderService.create(req.tenantDb!, req.body, userId);
            res.status(201).json({ success: true, message: 'Purchase order created', data });
        } catch (e) {
            next(e);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: userId } = requireAuthUser(req);
            const data = await PurchaseOrderService.update(req.tenantDb!, req.params.id as string, req.body, userId);
            res.json({ success: true, message: 'Purchase order updated', data });
        } catch (e) {
            next(e);
        }
    }

    static async remove(req: Request, res: Response, next: NextFunction) {
        try {
            await PurchaseOrderService.delete(req.tenantDb!, req.params.id as string);
            res.json({ success: true, message: 'Purchase order deleted' });
        } catch (e) {
            next(e);
        }
    }
}
