import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import branchRoutes from './branchRoutes';
import supplierRoutes from './supplierRoutes';
import inventoryRoutes from './inventoryRoutes';
import salesRoutes from './salesRoutes';
import purchaseRoutes from './purchaseRoutes';
import customerRoutes from './customerRoutes';
import accountRoutes from './accountRoutes';
import hrRoutes from './hrRoutes';
import reportRoutes from './reportRoutes';
import adminRoutes from './adminRoutes';
import licenseRoutes from './licenseRoutes';
import fileRoutes from './fileRoutes';

const router = Router();

/**
 * GET /api/v1  (and GET /api when router is mounted at /api)
 * Discovery endpoint — no auth; avoids confusing 404 when opening the base URL in a browser.
 */
router.get('/', (_req, res) => {
    res.json({
        success: true,
        name: 'Kinetic Vault ERP API',
        version: '1.0.0',
        message: 'Use versioned paths under this prefix (e.g. /api/v1/auth/login).',
        links: {
            self: '/api/v1',
            healthGlobal: '/health',
            healthV1: '/api/v1/health',
            licenseActivate: '/api/v1/license/activate',
        },
        tenantHint:
            'Most routes need a tenant: send x-tenant-id or use your tenant subdomain, then Authorization Bearer token where required.',
    });
});

/**
 * REST API Version 1
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/branches', branchRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/sales', salesRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/customers', customerRoutes);
router.use('/accounting', accountRoutes);
router.use('/hr', hrRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);
router.use('/license', licenseRoutes);
router.use('/files', fileRoutes);

// Health check endpoint
router.get('/health', async (req, res) => {
    let dbStatus = 'DISCONNECTED';
    try {
        const { masterPool } = await import('../../config/db.js');
        const result = await masterPool.query('SELECT NOW()');
        if (result.rows.length > 0) {
            dbStatus = 'CONNECTED';
        }
    } catch (e) {
        dbStatus = 'ERROR: ' + (e as Error).message;
    }

    res.json({
        status: 'UP',
        database: dbStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

export default router;
