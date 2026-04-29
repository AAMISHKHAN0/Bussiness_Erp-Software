import { Worker, Job, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { masterPool, masterQuery } from '../config/db';
import { encrypt } from '../config/tenantManager';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// Setup Redis connection for BullMQ
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

// Export Queue for adding jobs
export const provisioningQueue = new Queue('tenant-provisioning', { connection });

// Define Job Data structure
interface ProvisionJobData {
    companyId: string;
    dbName: string;
    dbHost: string;
    dbUser: string;
    dbPass: string;
}

// Setup Worker
const worker = new Worker('tenant-provisioning', async (job: Job<ProvisionJobData>) => {
    const { companyId, dbName, dbHost, dbUser, dbPass } = job.data;
    logger.info(`Starting provisioning job for company ${companyId}`);

    // Temporary pool as superuser to the MASTER DB to execute CREATE DATABASE
    // Note: The master DB user MUST have CREATEDB privileges
    
    try {
        logger.info(`Creating database: ${dbName}...`);
        // Cannot use parameterized queries for CREATE DATABASE
        await masterPool.query(`CREATE DATABASE "${dbName}"`);
    } catch (err: any) {
        // If it already exists, fail safely or continue
        if (err.code !== '42P04') { // 42P04 = duplicate_database
            throw new Error(`Failed to create database: ${err.message}`);
        }
    }

    // Connect specifically to the newly created tenant DB
    const tenantPool = new Pool({
        host: dbHost,
        database: dbName,
        user: dbUser, // Should ideally be superuser or have access to this new DB
        password: dbPass,
    });

    const client = await tenantPool.connect();

    try {
        await client.query('BEGIN');
        
        logger.info(`Running migrations for ${dbName}...`);
        const schemaPath = path.join(__dirname, '..', '..', 'migrations', '01_initial_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        
        // Optional: Run seeds or generate default Admin user here
        const seedPath = path.join(__dirname, '..', '..', 'migrations', '02_seed_data.sql');
        if (fs.existsSync(seedPath)) {
             const seedSql = fs.readFileSync(seedPath, 'utf8');
             await client.query(seedSql);
        }

        await client.query('COMMIT');
        logger.info(`Database ${dbName} provisioned successfully.`);

        // Mark company as active
        await masterQuery('UPDATE companies SET status = $1 WHERE id = $2', ['active', companyId]);

    } catch (err: any) {
        await client.query('ROLLBACK');
        logger.error(`Migration failed for ${dbName}`, { error: err });
        throw err;
    } finally {
        client.release();
        await tenantPool.end();
    }

}, { connection, concurrency: 1 });

worker.on('failed', async (job, err) => {
    logger.error(`${job?.id} has failed with ${err.message}`);
    if (job && job.data.companyId) {
        // Mark company as failed
        await masterQuery('UPDATE companies SET status = $1 WHERE id = $2', ['failed', job.data.companyId]);
        // Also theoretically drop the failed DB here as cleanup
    }
});

export const requestProvisioning = async (companyName: string, companySlug: string, plan: string) => {
    // Generate DB config
    const safeSlug = companySlug.replace(/[^a-z0-9]/g, '');
    const dbName = `erp_tenant_${safeSlug}`;
    const dbPass = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    const encryptedPass = encrypt(dbPass);
    
    // Insert into DB as pending
    const res = await masterQuery(`
        INSERT INTO companies (name, slug, db_name, db_host, db_user, encrypted_password, plan, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `, [companyName, companySlug, dbName, env.db.host, env.db.user, encryptedPass, plan, 'pending']);

    const companyId = res.rows[0].id;

    await provisioningQueue.add('provision', {
        companyId,
        dbName,
        dbHost: env.db.host,
        dbUser: env.db.user,
        dbPass: env.db.password // Warning: using master password for execution logic in this setup
    });

    return { success: true, companyId, message: "Provisioning started" };
};
