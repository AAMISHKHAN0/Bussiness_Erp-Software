import { Pool } from 'pg';

export interface TenantConfig {
    id: string;
    slug: string;
    dbName: string;
    dbHost: string;
    dbUser: string;
    encryptedPassword: string;
    plan: string;
    status: string;
}

export interface TokenPayload {
    id: string;
    email: string;
    role: string;
    permissions?: string[];
    branchId?: string;
}

declare global {
    namespace Express {
        interface Request {
            tenant?: TenantConfig;
            tenantDb?: Pool;
            user?: TokenPayload;
        }
    }
}

export {};
