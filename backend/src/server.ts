import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import http from 'http';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectWithRetry, masterPool } from './config/db';
import { initializeDatabase } from './config/dbInit';
import routes from './api/routes';
import { errorHandler } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimiter';
import { tenantMiddleware } from './middlewares/tenantMiddleware';

const app = express();

// ─── Optimization & Security ────────────────────────────────────────
app.use(compression());
app.use(helmet({
    contentSecurityPolicy: env.nodeEnv === 'production',
    crossOriginEmbedderPolicy: env.nodeEnv === 'production',
    crossOriginResourcePolicy: false
}));

// ─── CORS ───────────────────────────────────────────────────────────
app.use(
    cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-tenant-id'],
    })
);

// ─── Body Parsing ───────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Static Files ───────────────────────────────────────────────────
app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(__dirname, '..', 'uploads')));

// ─── Health Check ───────────────────────────────────────────────────
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        environment: env.nodeEnv,
        uptime: process.uptime(),
        database: masterPool.totalCount > 0 ? 'CONNECTED' : 'DISCONNECTED'
    });
});

// ─── Rate Limiting ──────────────────────────────────────────────────
// Temporarily disabled for thorough audit / automated testing
// app.use('/api', apiLimiter);

// ─── Request Logging ────────────────────────────────────────────────
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    next();
});

/** Discovery document for bare /api and /api/v1 (router only defines nested paths). Tenant enforced below for business routes. */
const sendApiV1Discovery = (req: Request, res: Response) => {
    const host = req.get('host') || `localhost:${env.port}`;
    const base = `${req.protocol}://${host}`;
    res.json({
        success: true,
        name: 'Kinetic Vault ERP API',
        version: '1.0.0',
        basePath: '/api/v1',
        endpoints: {
            discovery: `${base}/api/v1`,
            healthPublic: `${base}/health`,
            healthV1: `${base}/api/v1/health`,
            auth: `${base}/api/v1/auth`,
            license: `${base}/api/v1/license`,
        },
        auth: {
            note: 'Protected routes expect Authorization (Bearer) and tenant context via subdomain or x-tenant-id header.',
        },
    });
};
app.get('/api/v1', sendApiV1Discovery);
app.get('/api', sendApiV1Discovery);

// ─── Multi-Tenant Resolver ──────────────────────────────────────────
// Tenant is required for business routes. Public under this prefix: API root, health, license, auth.
app.use('/api/v1', (req, res, next) => {
    const pathOnly = req.originalUrl.split('?')[0] || '';
    const rest =
        pathOnly.startsWith('/api/v1') ? pathOnly.slice('/api/v1'.length) || '/' : pathOnly;
    const isPublic =
        rest === '/' ||
        rest === '' ||
        rest.startsWith('/license') ||
        rest.startsWith('/health') ||
        rest.startsWith('/auth');
    if (isPublic) return next();
    return tenantMiddleware(req, res, next);
});

// ─── v1 API Routes ─────────────────────────────────────────────────
app.use('/api/v1', routes);

// Legacy `/api` alias (frontend often uses /api/auth/...): same tenant rules as v1, but skip paths already under /api/v1.
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const pathOnly = req.originalUrl.split('?')[0] || '';
    if (pathOnly.startsWith('/api/v1')) return next();
    const rest = pathOnly.startsWith('/api') ? pathOnly.slice('/api'.length) || '/' : pathOnly;
    const isPublic =
        rest === '/' ||
        rest === '' ||
        rest.startsWith('/license') ||
        rest.startsWith('/health') ||
        rest.startsWith('/auth');
    if (isPublic) return next();
    return tenantMiddleware(req, res, next);
});
app.use('/api', routes);

// ─── Default Home Route ─────────────────────────────────────────────
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Kinetic Vault ERP API', 
    version: '1.0.0 (Production-Ready v1)',
    docs: 'Available at /docs' 
  });
});

// ─── 404 Handler ────────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// ─── Global Error Handler ───────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server Logic ─────────────────────────────────────────────
const startServer = async () => {
    let port = parseInt(process.env.PORT || String(env.port)) || 5000;
    const server = http.createServer(app);

    const listen = () => {
        server.listen(port);
    };

    server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
            logger.warn(`⚠️ Port ${port} is already in use. Retrying on port ${port + 1}...`);
            port++;
            listen();
        } else {
            logger.error('❌ Server failed to start', { error: error.message });
            process.exit(1);
        }
    });

    server.on('listening', async () => {
        const addr = server.address();
        const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`;
        const finalPort = addr && typeof addr !== 'string' ? addr.port : port;
        
        logger.info('──────────────────────────────────────────────────');
        logger.info(`🚀 Kinetic Vault ERP Server running on ${bind}`);
        logger.info(`🌐 Environment: ${env.nodeEnv}`);
        logger.info(`📡 API v1: http://localhost:${finalPort}/api/v1`);
        logger.info('──────────────────────────────────────────────────');

        // Background DB connection attempt
        connectWithRetry().then(async (connected) => {
            if (connected) {
                // Auto-create tables and seed data if missing
                await initializeDatabase();
            } else {
                logger.error('❌ Failed to establish persistent DB connection. Check your credentials.');
            }
        });
    });

    listen();

    // Graceful Shutdown
    const shutdown = async () => {
        logger.info('Shutting down server gracefully...');
        server.close(async () => {
            logger.info('HTTP server closed.');
            try {
                await masterPool.end();
                logger.info('Database pool closed.');
                process.exit(0);
            } catch (err) {
                logger.error('Error during database pool shutdown', err);
                process.exit(1);
            }
        });

        // Force exit after 10s if graceful shutdown fails
        setTimeout(() => {
            logger.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
};

startServer().catch((err) => {
    logger.error('Fatal startup error', { error: err.message });
    process.exit(1);
});

export default app;
// Triggers nodemon restart
