import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { env } from '../config/env';

/**
 * Global error handler middleware
 * Catches all errors and returns a consistent JSON response
 */
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    // Default to 500 if no status code set
    const statusCode = err.statusCode || 500;
    const isOperational = err.isOperational || false;

    // Log the error
    if (statusCode >= 500) {
        logger.error(`[${req.method}] ${req.originalUrl} — ${err.message}`, {
            stack: err.stack,
            body: req.body,
            ip: req.ip,
        });
    } else {
        logger.warn(`[${req.method}] ${req.originalUrl} — ${statusCode} ${err.message}`);
    }

    // Build response
    const response: any = {
        success: false,
        message: isOperational ? err.message : 'Internal server error',
    };

    if (err.details) {
        response.details = err.details;
    }

    // Include stack trace in development
    if (env.nodeEnv === 'development' && !isOperational) {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};
