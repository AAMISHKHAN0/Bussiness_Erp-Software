import { LRUCache } from 'lru-cache';
import crypto from 'crypto';
import { Pool } from 'pg';
import { env } from './env';
import { masterQuery } from './db';
import { logger } from '../utils/logger';
import { handleMockQuery } from '../utils/mockDb';

// ─── Decryption Logic ────────────────────────────────────────────────
const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(env.crypto.tenantEncryptionKey, 'salt', 32);

export const decrypt = (encrypted: string): string => {
    try {
        const [ivHex, encryptedHex] = encrypted.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        logger.error('Failed to decrypt database password', { error: err });
        throw new Error('Database configuration error');
    }
};

export const encrypt = (text: string): string => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
};

// ─── Storage of Active Pools ──────────────────────────────────────────

const poolCache = new LRUCache<string, Pool | any>({
    max: env.tenant.maxPools,
    dispose: (pool, key) => {
        logger.info(`Closing unused tenant pool for ${key}`);
        if (pool.end) {
            pool.end().catch((err: any) => {
                logger.error(`Error closing pool for ${key}`, { error: err.message });
            });
        }
    }
});

// ─── Tenant Resolution ────────────────────────────────────────────────
export interface TenantConfig {
    id: string;
    name: string;
    slug: string;
    db_name: string;
    db_host: string;
    db_user: string;
    encrypted_password: string;
    plan: string;
    status: string;
}

export const getTenantPool = async (identifier: string, isSlug = false): Promise<{ pool: Pool | any, tenant: TenantConfig }> => {
    try {
        const queryStr = isSlug 
            ? 'SELECT * FROM companies WHERE slug = $1 AND status = $2'
            : 'SELECT * FROM companies WHERE id = $1 AND status = $2';
        
        const res = await masterQuery(queryStr, [identifier, 'active']);
        
        if (res.rows.length === 0) {
            if (env.allowDbMockFallback) {
                return getMockTenant();
            }
            throw new Error('Tenant not found or suspended');
        }

        const tenant = res.rows[0] as TenantConfig;
        const tenantId = tenant.id;

        if (poolCache.has(tenantId)) {
            return { pool: poolCache.get(tenantId)!, tenant };
        }

        // Keep localhost development stable by forcing the dedicated mock tenant
        // through the in-memory adapter instead of a partially provisioned real DB.
        const isMockTenant =
            tenant.slug === 'mock-default' ||
            tenant.db_name === 'mock_db' ||
            (tenant.db_host === 'localhost' && tenant.db_user === 'mock');

        // Avoid creating a real PostgreSQL Pool if this is a known Mock company
        if (isMockTenant) {
            const mockEnv = getMockTenant(tenant);
            poolCache.set(tenantId, mockEnv.pool);
            return mockEnv;
        }

        logger.info(`Initializing new DB connection pool for tenant: ${tenant.slug}`);
        const isLocalTenant = tenant.db_host === 'localhost' || tenant.db_host === '127.0.0.1' || tenant.db_host === 'db';
        const useSSLTenant = !isLocalTenant || tenant.db_host.includes('supabase.co');

        const pool = new Pool({
            host: tenant.db_host,
            database: tenant.db_name,
            user: tenant.db_user,
            password: decrypt(tenant.encrypted_password),
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
            ssl: useSSLTenant ? { rejectUnauthorized: false } : false,
        });

        pool.on('error', (err: Error) => {
            logger.error(`Unexpected error on tenant PostgreSQL client (${tenant.slug})`, { error: err.message });
        });

        poolCache.set(tenantId, pool);
        return { pool, tenant };

    } catch (error: any) {
        if (env.allowDbMockFallback) {
            logger.warn(`⚠️ [MockDB] Tenant resolution failed, using fallback mock tenant. Error: ${error.message}`);
            return getMockTenant();
        }
        throw error;
    }
};

const getMockTenant = (configuredTenant?: TenantConfig): { pool: any, tenant: TenantConfig } => {
    const mockTenant: TenantConfig = configuredTenant || {
        id: 'mock-tenant-id',
        name: 'Mock Company (Fallback Mode)',
        slug: 'default',
        db_name: 'mock_db',
        db_host: 'localhost',
        db_user: 'mock_user',
        encrypted_password: '',
        plan: 'enterprise',
        status: 'active'
    };

    const runQuery = (text: string, params?: any[]) => handleMockQuery(text, params ?? [], mockTenant.id);

    const mockPool = {
        query: runQuery,
        connect: async () => ({
            query: runQuery,
            release: () => {},
        }),
        on: () => {},
        end: async () => {},
    };

    return { pool: mockPool, tenant: mockTenant };
};
