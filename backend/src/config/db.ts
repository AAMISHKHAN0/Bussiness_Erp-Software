import { Pool } from 'pg';
import { env } from './env';
import { logger } from '../utils/logger';
import { handleMockQuery } from '../utils/mockDb';

// Pool configuration with production-ready settings
export const masterPool = new Pool({
    host: env.db.host,
    port: env.db.port,
    database: env.db.name,
    user: env.db.user,
    password: env.db.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Log pool events
masterPool.on('connect', () => {
    logger.debug('New client connected to PostgreSQL master pool');
});

masterPool.on('error', (err: Error) => {
    logger.error('Unexpected error on idle PostgreSQL master client', { error: err.message });
});

/**
 * Connect to database with retry logic
 */
export const connectWithRetry = async (
    retries = env.db.retryAttempts, 
    delay = env.db.retryDelayMs
): Promise<boolean> => {
    for (let i = 1; i <= retries; i++) {
        try {
            const client = await masterPool.connect();
            const result = await client.query('SELECT NOW()');
            client.release();
            logger.info(`✅ PostgreSQL Master DB connected at ${env.db.host}:${env.db.port}/${env.db.name} (Attempt ${i})`);
            return true;
        } catch (err: any) {
            const errorMsg = err.message || (typeof err === 'string' ? err : JSON.stringify(err));
            
            // Check if we should jump straight to Mock Mode to avoid long wait times
            if (env.allowDbMockFallback && err.code === 'ECONNREFUSED') {
                logger.warn(`──────────────────────────────────────────────────`);
                logger.warn(`🚀 [AUTO-FALLBACK] PostgreSQL is OFFLINE (Connection Refused).`);
                logger.warn(`🚀 Jumping straight to in-memory Mock Database.`);
                logger.warn(`⚠️  Data will NOT be persisted. No further retries.`);
                logger.warn(`──────────────────────────────────────────────────`);
                return true; // Allow server to start immediately
            }

            logger.warn(`⚠️ PostgreSQL connection attempt ${i} failed: ${errorMsg}. Retrying in ${delay / 1000}s...`);
            
            if (err.code === '28P01') {
                logger.error('❌ Invalid Password for user ' + env.db.user);
            } else if (err.code === '3D000') {
                logger.error('❌ Database "' + env.db.name + '" does not exist.');
            }

            if (i === retries) {
                logger.error('❌ Maximum database connection retries reached.');
                if (env.allowDbMockFallback) {
                    logger.warn('──────────────────────────────────────────────────');
                    logger.warn('🚀 [MOCK MODE] PostgreSQL is OFFLINE.');
                    logger.warn('🚀 Falling back to in-memory Mock Database.');
                    logger.warn('⚠️  Data will NOT be persisted to PostgreSQL!');
                    logger.warn('──────────────────────────────────────────────────');
                    return true;
                }
                return false;
            }
            await new Promise(res => setTimeout(res, delay));
        }
    }
    return false;
};

/**
 * Test master database connection (Legacy wrapper for backward compatibility)
 */
export const testConnection = async (): Promise<boolean> => {
    return connectWithRetry(1); // One-shot check
};

/**
 * Global helper to execute a query on the Master DB
 * NEVER use this for tenant queries!
 */
export const masterQuery = async (text: string, params?: any[]): Promise<any> => {
    const start = Date.now();
    try {
        const result = await masterPool.query(text, params);
        const duration = Date.now() - start;
        logger.debug('Master query executed', { text: text.substring(0, 80), duration: `${duration}ms`, rows: result.rowCount });
        return result;
    } catch (err: any) {
        if (env.allowDbMockFallback) {
             logger.warn('⚠️ [MockDB] PostgreSQL query failed, falling back to mock data', { 
                 text: text.substring(0, 50),
                 error: err.message 
             });
             return handleMockQuery(text, params);
        }
        logger.error('Master query error', { text: text.substring(0, 80), error: err.message });
        throw err;
    }
};
