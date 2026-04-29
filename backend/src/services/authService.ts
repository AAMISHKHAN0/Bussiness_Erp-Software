import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthRepository } from '../repositories/authRepository';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { isValidPassword } from '../utils/validators';
import type { TokenPayload } from '../types/tokenPayload';
import { Pool } from "pg";

// Store refresh tokens (In production, use Redis. For now using memory map)
const refreshTokens = new Map<string, { userId: string; expires: number }>();

export type { TokenPayload } from '../types/tokenPayload';

export class AuthService {
    private static formatUser(user: any, roleName: string | null, permissions: string[]) {
        const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();

        return {
            id: user.id,
            email: user.email,
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            name: name || user.email,
            role: roleName,
            permissions,
            branchId: user.branch_id
        };
    }

    /**
     * Generate Access and Refresh JWTs
     */
    static generateTokens(db: Pool, user: any, roleName: string | null, permissions: string[]) {
        const payload: TokenPayload = {
            id: user.id,
            email: user.email,
            role: roleName || '',
            permissions: permissions,
            branchId: user.branch_id
        };

        const accessToken = jwt.sign(payload, env.jwt.secret, {
            expiresIn: env.jwt.expiry as any
        });

        const refreshToken = jwt.sign(
            { id: user.id, email: user.email },
            env.jwt.refreshSecret,
            { expiresIn: env.jwt.refreshExpiry as any }
        );

        // Tracking (Simplified for now - will move to Redis/DB in Phase 3-4)
        const expiryMatch = env.jwt.refreshExpiry.match(/([0-9]+)d/); // e.g. "7d"
        const expiresMs = expiryMatch ? parseInt(expiryMatch[1]) * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

        refreshTokens.set(refreshToken, {
            userId: user.id,
            expires: Date.now() + expiresMs
        });

        return { accessToken, refreshToken };
    }

    /**
     * Authenticate a user and return tokens
     */
    static async login(db: Pool, email: string, password: string) {
        const user = await AuthRepository.findUserByEmail(db, email);

        if (!user) {
            throw ApiError.unauthorized('Invalid email or password');
        }

        if (!user.is_active) {
            throw ApiError.forbidden('Your account has been deactivated. Contact an administrator.');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw ApiError.unauthorized('Invalid email or password');
        }

        // Get role permissions
        const access = await AuthRepository.resolveUserAccess(db, user);

        // Update last login (fire and forget)
        AuthRepository.updateLastLogin(db, user.id).catch(err =>
            logger.error('Failed to update last login', { error: err.message, userId: user.id })
        );

        const tokens = this.generateTokens(db, user, access.roleName, access.permissions);

        return {
            user: this.formatUser(user, access.roleName, access.permissions),
            tokens
        };
    }

    /**
     * Register a new user (Only callable by Admins)
     */
    static async registerUser(db: Pool, userData: any) {
        if (!isValidPassword(userData.password)) {
            throw ApiError.badRequest(
                'Password must be at least 8 characters and include uppercase, lowercase, and a number'
            );
        }

        const existingUser = await AuthRepository.findUserByEmail(db, userData.email);
        if (existingUser) {
            throw ApiError.conflict('User with this email already exists');
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(userData.password, salt);

        const newUser = await AuthRepository.createUser(db, {
            ...userData,
            passwordHash
        });

        return newUser;
    }

    /**
     * Refresh an access token
     */
    static async refreshToken(db: Pool, oldRefreshToken: string) {
        if (!oldRefreshToken) {
            throw ApiError.unauthorized('Refresh token is required');
        }

        // Check in-memory map if available (optional extra layer, not required)
        const tokenData = refreshTokens.get(oldRefreshToken);
        if (tokenData && Date.now() > tokenData.expires) {
            refreshTokens.delete(oldRefreshToken);
            throw ApiError.unauthorized('Refresh token has expired. Please login again.');
        }

        try {
            // Verify JWT signature — this is the primary validation (survives server restarts)
            const decoded: any = jwt.verify(oldRefreshToken, env.jwt.refreshSecret);
            const user = await AuthRepository.findUserById(db, decoded.id);

            if (!user || !user.is_active) {
                refreshTokens.delete(oldRefreshToken);
                throw ApiError.unauthorized('User no longer exists or is deactivated');
            }

            const fullUser = await AuthRepository.findUserByEmail(db, user.email);
            const access = await AuthRepository.resolveUserAccess(db, fullUser);

            const tokens = this.generateTokens(db, fullUser, access.roleName, access.permissions);
            refreshTokens.delete(oldRefreshToken); // Consume the old one

            return tokens;
        } catch (error: any) {
            refreshTokens.delete(oldRefreshToken);
            if (error.statusCode) throw error; // Re-throw ApiErrors as-is
            throw ApiError.unauthorized('Invalid refresh token');
        }
    }

    /**
     * Logout
     */
    static logout(db: Pool, refreshToken?: string) {
        if (refreshToken && refreshTokens.has(refreshToken)) {
            refreshTokens.delete(refreshToken);
        }
        return true;
    }

    static async getCurrentUser(db: Pool, userId: string, email?: string) {
        let user = await AuthRepository.findUserById(db, userId);
        if (!user && email) {
            user = await AuthRepository.findUserByEmail(db, email);
        }

        if (!user || !user.is_active) {
            throw ApiError.unauthorized('User no longer exists or is deactivated');
        }

        const access = await AuthRepository.resolveUserAccess(db, user);
        return this.formatUser(user, access.roleName, access.permissions);
    }
}
