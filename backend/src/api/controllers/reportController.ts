import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../../services/reportService';

export class ReportController {
    /**
     * GET /api/v1/reports/sales-summary
     */
    static async getSalesSummary(req: Request, res: Response, next: NextFunction) {
        try {
            const { month } = req.query;
            const data = await ReportService.getSalesSummary(req.tenantDb!, month as string);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reports/dashboard-timeseries
     */
    static async getDashboardTimeSeries(req: Request, res: Response, next: NextFunction) {
        try {
            const months = Number(req.query.months || 6);
            const data = await ReportService.getDashboardTimeSeries(req.tenantDb!, months);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reports/inventory-summary
     */
    static async getInventorySummary(req: Request, res: Response, next: NextFunction) {
        try {
            const { category } = req.query;
            const data = await ReportService.getInventorySummary(req.tenantDb!, category as string);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reports/hr-summary
     */
    static async getHRSummary(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await ReportService.getHRHeadcount(req.tenantDb!);
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/reports/dashboard-stats
     */
    static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await ReportService.getDashboardStats(req.tenantDb!);
            res.json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }
}
