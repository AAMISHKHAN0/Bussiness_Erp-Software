import { Request, Response, NextFunction } from 'express';
import { getTenantPool, TenantConfig } from '../config/tenantManager';
import { Pool } from 'pg';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { TokenPayload } from '../types/tokenPayload';



export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let identifier: string | undefined;
        let isSlug = false;

        // 1. Subdomain Extraction
        const host = req.headers.host;
        if (host) {
            const parts = host.split('.');
            if (parts.length > 2 || (parts.length === 2 && parts[1].startsWith('localhost'))) {
                identifier = parts[0];
                isSlug = true;
            }
        }

        // 2. Header Fallback (x-tenant-id)
        if (!identifier) {
            const headerTenant = req.headers['x-tenant-id'];
            if (typeof headerTenant === 'string') {
                identifier = headerTenant;
                isSlug = true; 
            }
        }

        // 3. JWT Fallback 
        // Note: req.user might not be populated depending on route order, but fallback covers it
        if (!identifier && (req as any).user && (req as any).user.tenantId) {
            identifier = (req as any).user.tenantId;
            isSlug = false;
        }

        if (!identifier) {
            const isIPHost = host && /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host.split(':')[0]);
            if (isIPHost) {
                logger.info(`Detected IP access (${host}). Falling back to 'default' tenant.`);
                identifier = 'default';
                isSlug = true;
            } else if (env.allowDbMockFallback) {
                logger.info('⚠️ [MockDB] No tenant context found. Using default mock tenant.');
                identifier = 'mock-default';
                isSlug = true;
            } else {
                return res.status(400).json({ success: false, message: 'Tenant context required (subdomain or x-tenant-id)' });
            }
        }

        // Resolve pool and config
        const { pool, tenant } = await getTenantPool(identifier, isSlug);

        // Security Validation
        if (tenant.status !== 'active') {
            return res.status(403).json({ success: false, message: 'Tenant account is disabled or suspended' });
        }

        (req as any).tenant = tenant;
        (req as any).tenantDb = pool;

        next();
    } catch (error: any) {
        const msg = error.message.toLowerCase();
        logger.error('Tenant resolution failed', { error: error.message, url: req.url });

        if (msg.includes('not found') || msg.includes('suspended')) {
            return res.status(404).json({ success: false, message: 'Tenant not found or inactive' });
        }

        if (msg.includes('econnrefused') || msg.includes('timeout')) {
            return res.status(503).json({ 
                success: false, 
                message: 'Database connection failed. Please ensure PostgreSQL is running.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }

        res.status(500).json({ success: false, message: 'Internal Server Error computing tenant routing' });
    }
};
