import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { isTokenPayload, type TokenPayload } from '../types/tokenPayload';
import { AuthRepository } from '../repositories/authRepository';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * JWT Authentication Middleware
 * Verifies the JWT token from the Authorization header
 * and attaches the decoded user to req.user
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
        let token = '';
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            throw ApiError.unauthorized('Access token is required');
        }

        const decoded = jwt.verify(token, env.jwt.secret);
        if (!isTokenPayload(decoded)) {
            console.error('Invalid token payload detected:', decoded); // DEBUG
            return next(ApiError.unauthorized('Invalid token payload'));
        }
        req.user = decoded;
        next();
    } catch (err: unknown) {
        const name = err && typeof err === 'object' && 'name' in err ? String((err as { name: unknown }).name) : '';
        if (name === 'TokenExpiredError') {
            console.error('Token Expired'); // DEBUG 
            return next(ApiError.unauthorized('Token has expired'));
        }
        if (name === 'JsonWebTokenError') {
            console.error('JWT Error:', err); // DEBUG
            return next(ApiError.unauthorized('Invalid token'));
        }
        next(err);
    }
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks if the user has the required permission
 */
export const authorize = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Not authenticated');
      }

      // Super Admin bypass
      if (req.user.role === 'Super Admin' || req.user.permissions?.includes('*')) {
        return next();
      }

      if ((!req.user.role || !req.user.permissions?.length) && (req as any).tenantDb && req.user.id) {
        let dbUser = await AuthRepository.findUserById((req as any).tenantDb, req.user.id);
        if (!dbUser && req.user.email) {
          dbUser = await AuthRepository.findUserByEmail((req as any).tenantDb, req.user.email);
        }
        if (dbUser) {
          const access = await AuthRepository.resolveUserAccess((req as any).tenantDb, {
            ...dbUser,
            email: req.user.email,
          });
          req.user = {
            ...req.user,
            role: access.roleName || req.user.role,
            permissions: access.permissions.length ? access.permissions : (req.user.permissions || []),
            branchId: dbUser.branch_id ?? req.user.branchId,
          };
        }
      }

      if (req.user.role === 'Super Admin' || req.user.permissions?.includes('*')) {
        return next();
      }

      if (!req.user.permissions || !req.user.permissions.includes(requiredPermission)) {
        throw ApiError.forbidden(`You do not have permission: ${requiredPermission}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user is Admin
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'Admin' && req.user?.role !== 'Super Admin') {
    return next(ApiError.forbidden('Admin priority required'));
  }
  next();
};
