import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/authService';
import { ApiError } from '../../utils/ApiError';
import { validateRequired } from '../../utils/validators';
import { masterPool, masterQuery } from '../../config/db';

export class AuthController {
    /**
     * POST /api/v1/auth/login
     */
    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;

            const required = validateRequired(req.body, ['email', 'password']);
            if (!required.valid) {
              throw ApiError.badRequest(`Missing required fields: ${required.missing.join(', ')}`);
            }

            // Use tenant database if available, otherwise use master query (with mock fallback)
            const db = req.tenantDb || { query: masterQuery } as any;
            const loginResult = await AuthService.login(db, email, password);
            const isProduction = process.env.NODE_ENV === 'production';

            // Set secure session tokens as HTTP-only cookies
            res.cookie('accessToken', loginResult.tokens.accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'lax', // Support multi-tenant subdomains
                maxAge: 15 * 60 * 1000 // 15 mins
            });

            res.cookie('refreshToken', loginResult.tokens.refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.json({
                success: true,
                message: 'Login successful',
                data: loginResult
            });
        } catch (error: any) {
            // Give clear error if DB is down
            const msg = (error.message || '').toLowerCase();
            if (msg.includes('econnrefused') || msg.includes('connection terminated') || msg.includes('relation') || msg.includes('does not exist')) {
                return res.status(503).json({
                    success: false,
                    message: 'Database is initializing. Please wait a few seconds and try again.'
                });
            }
            next(error);
        }
    }

    /**
     * POST /api/v1/auth/register
     */
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, firstName, lastName, roleId, branchId } = req.body;

            const required = validateRequired(req.body, ['email', 'password', 'firstName', 'lastName']);
            if (!required.valid) {
              throw ApiError.badRequest(`Missing required fields: ${required.missing.join(', ')}`);
            }

            // Use tenant database if available, otherwise use master query (with mock fallback)
            const db = req.tenantDb || { query: masterQuery } as any;
            const newUser = await AuthService.registerUser(db, {
                email,
                password,
                firstName,
                lastName,
                roleId: roleId || null,
                branchId: branchId || null
            });

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: newUser
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/auth/refresh
     */
    static async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

            if (!refreshToken) {
                throw ApiError.unauthorized('Refresh token required');
            }

            // Use tenant database if available, otherwise use master query (with mock fallback)
            const db = req.tenantDb || { query: masterQuery } as any;
            const tokens = await AuthService.refreshToken(db, refreshToken);
            const isProduction = process.env.NODE_ENV === 'production';

            // Set the new access token
            res.cookie('accessToken', tokens.accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000
            });

            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: tokens
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/auth/logout
     */
    static async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
            // Use tenant database if available, otherwise use master query (with mock fallback)
            const db = req.tenantDb || { query: masterQuery } as any;
            AuthService.logout(db, refreshToken);
            
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');

            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/auth/me
     */
    static async getMe(req: any, res: Response, next: NextFunction) {
        try {
            // User should be attached by auth middleware
            if (!req.user) {
                throw ApiError.unauthorized('Not authenticated');
            }

            // Use tenant database if available, otherwise use master query (with mock fallback)
            const db = req.tenantDb || { query: masterQuery } as any;
            const currentUser = await AuthService.getCurrentUser(db, req.user.id, req.user.email);

            res.json({
                success: true,
                data: currentUser
            });
        } catch (error) {
            next(error);
        }
    }
}
