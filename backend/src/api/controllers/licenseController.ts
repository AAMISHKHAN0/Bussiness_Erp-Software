import { Request, Response, NextFunction } from 'express';
import { LicenseService } from '../../services/licenseService';

export class LicenseController {
    /**
     * GET /api/v1/license/status
     */
    static async getStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const status = LicenseService.getStatus();
            res.json({ success: true, data: status });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/license/activate
     * Body: { key: "COMPANY1-ERP-KEY" }
     */
    static async activate(req: Request, res: Response, next: NextFunction) {
        try {
            const { key } = req.body;
            const result = await LicenseService.activateKey(key as string);

            res.json({
                success: true,
                message: `${result.tier} license activated successfully!`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/license/keys
     * Admin only tool to view all keys
     */
    static async getKeys(req: Request, res: Response, next: NextFunction) {
        try {
            const keys = await LicenseService.getAllKeys();
            res.json({ success: true, data: keys });
        } catch (error) {
            next(error);
        }
    }
}
