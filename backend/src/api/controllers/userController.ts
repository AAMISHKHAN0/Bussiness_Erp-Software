import { Request, Response, NextFunction } from 'express';
import { UserService } from '../../services/userService';

export class UserController {
    /**
     * GET /api/v1/users
     * Get all users (Admin only)
     */
    static async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await UserService.getAllUsers(req.tenantDb!);
            res.json({ success: true, count: users.length, data: users });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/users/:id
     * Get a single user
     */
    static async getUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const user = await UserService.getUserById(req.tenantDb!, id as string);
            res.json({ success: true, data: user });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/users/:id/deactivate
     */
    static async deactivateUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await UserService.deactivateUser(req.tenantDb!, id as string);
            res.json({ success: true, message: 'User deactivated successfully', data: result });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/users/:id/reactivate
     */
    static async reactivateUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await UserService.reactivateUser(req.tenantDb!, id as string);
            res.json({ success: true, message: 'User reactivated successfully', data: result });
        } catch (error) {
            next(error);
        }
    }
}
