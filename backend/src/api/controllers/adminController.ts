import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../../services/adminService';
import { requireAuthUser } from '../../utils/requestUser';

export class AdminController {
    /**
     * GET /api/v1/admin/settings
     * Get system settings
     */
    static async getSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const settings = await AdminService.getSettings(req.tenantDb!);
            res.json({ success: true, data: settings });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/v1/admin/settings
     * Update system settings
     */
    static async updateSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = requireAuthUser(req).id;
            const updated = await AdminService.updateSettings(req.tenantDb!, req.body, userId);
            res.json({
                success: true,
                message: 'Settings updated successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/admin/audit-logs
     * Get audit logs
     */
    static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const limit = parseInt(req.query.limit as string) || 50;
            const logs = await AdminService.getAuditLogs(req.tenantDb!, limit);
            res.json({ success: true, count: logs.length, data: logs });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/admin/health
     * Get system health and metrics
     */
    static async getHealth(req: Request, res: Response, next: NextFunction) {
        try {
            const health = await AdminService.getSystemHealth(req.tenantDb!);
            res.json({ success: true, data: health });
        } catch (error) {
            next(error);
        }
    }
}
