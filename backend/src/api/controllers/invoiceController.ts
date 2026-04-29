import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../../services/invoiceService';

export class InvoiceController {
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const rows = await InvoiceService.list(req.tenantDb!);
            res.json({ success: true, count: rows.length, data: rows });
        } catch (e) {
            next(e);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await InvoiceService.create(req.tenantDb!, req.body);
            res.status(201).json({ success: true, message: 'Invoice created', data });
        } catch (e) {
            next(e);
        }
    }

    static async deleteInvoice(req: Request, res: Response, next: NextFunction) {
        try {
            await InvoiceService.deleteById(req.tenantDb!, req.params.id as string);
            res.json({ success: true, message: 'Invoice deleted' });
        } catch (e) {
            next(e);
        }
    }
}
