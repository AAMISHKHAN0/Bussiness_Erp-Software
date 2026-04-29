import { Request, Response, NextFunction } from 'express';
import { BranchService } from '../../services/branchService';
import { ApiError } from '../../utils/ApiError';
import { validateRequired } from '../../utils/validators';

export class BranchController {
    /**
     * GET /api/v1/branches
     * Get all active branches
     */
    static async getBranches(req: Request, res: Response, next: NextFunction) {
        try {
            const branches = await BranchService.getActiveBranches(req.tenantDb!);
            res.json({ success: true, count: branches.length, data: branches });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/branches
     * Create a new branch
     */
    static async createBranch(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, address, phone, email } = req.body;

            const required = validateRequired(req.body, ['name', 'address']);
            if (!required.valid) {
                throw ApiError.badRequest(`Missing required fields: ${required.missing.join(', ')}`);
            }

            const newBranch = await BranchService.createBranch(req.tenantDb!, { name, address, phone, email });
            res.status(201).json({
                success: true,
                message: 'Branch created successfully',
                data: newBranch
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/branches/:id
     * Get branch by ID
     */
    static async getBranchById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const branch = await BranchService.getBranchById(req.tenantDb!, id as string);
            res.json({ success: true, data: branch });
        } catch (error) {
            next(error);
        }
    }
}
