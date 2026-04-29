import dotenv from 'dotenv';
import path from 'path';

// Load .env file from root
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const requiredVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

// Validate required environment variables
const missing = requiredVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),

  // Database
  db: {
    host: process.env.DB_HOST as string,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME as string,
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '10', 10),
    retryDelayMs: parseInt(process.env.DB_RETRY_DELAY_MS || '5000', 10),
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET as string,
    refreshSecret: process.env.JWT_REFRESH_SECRET as string,
    expiry: process.env.JWT_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Cryptography
  crypto: {
      tenantEncryptionKey: process.env.TENANT_ENCRYPTION_KEY || 'default-encryption-key-for-tenant-dbs'
  },
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Tenant Pooling
  tenant: {
    maxPools: parseInt(process.env.MAX_TENANT_POOLS || '50', 10),
  },

  /** When true, failed PostgreSQL queries fall back to in-memory mock data (dangerous in production). */
  allowDbMockFallback: process.env.ALLOW_DB_MOCK_FALLBACK === 'true',
};
