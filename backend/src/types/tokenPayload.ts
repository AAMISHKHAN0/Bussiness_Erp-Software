/**
 * JWT access-token payload (must match AuthService.generateTokens)
 */
export interface TokenPayload {
    id: string;
    email: string;
    role: string;
    permissions: string[];
    branchId: string;
}

export function isTokenPayload(value: unknown): value is TokenPayload {
    if (!value || typeof value !== 'object') return false;
    const o = value as Record<string, unknown>;
    return (
        (typeof o.id === 'string' || typeof o.id === 'number') &&
        typeof o.email === 'string' &&
        (typeof o.role === 'string' || o.role === null || typeof o.role === 'undefined') &&
        Array.isArray(o.permissions) &&
        o.permissions.every((p) => typeof p === 'string') &&
        (o.branchId === null || typeof o.branchId === 'undefined' || typeof o.branchId === 'string' || typeof o.branchId === 'number')
    );
}
