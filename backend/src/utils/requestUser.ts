import { Request } from 'express';
import { ApiError } from './ApiError';

/**
 * Require an authenticated user on the request (routes must use `authenticate` first).
 */
export function requireAuthUser(req: Request) {
    const user = req.user;
    if (!user?.id) {
        throw ApiError.internal('Authenticated user context is missing');
    }
    return user;
}
