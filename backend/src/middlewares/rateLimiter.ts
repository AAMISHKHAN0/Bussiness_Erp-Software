import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * General API rate limiter
 * Redis-based rate limiting is recommended for production (Phase 4)
 */
export const apiLimiter = rateLimit({
    windowMs: env.rateLimit.windowMs || 15 * 60 * 1000, 
    max: env.rateLimit.maxRequests || 1000, 
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests. Please try again later.',
    },
});

/**
 * Stricter rate limiter for auth endpoints
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
});
