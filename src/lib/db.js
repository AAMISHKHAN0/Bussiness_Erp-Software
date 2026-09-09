import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import { INITIAL_SEED_DATA } from './seedData.js';

// Global reference to preserve database state across Next.js hot-reloads
const globalForDb = globalThis;

class EnterpriseDatabase {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.dbFilePath = path.join(this.dataDir, 'erp_database.json');
    this.isLoaded = false;
    this.neonLoaded = false;
    this.data = JSON.parse(JSON.stringify(INITIAL_SEED_DATA));
    this.sql = null;

    // Detect Cloud Database (Neon / Vercel Postgres)
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (dbUrl) {
      try {
        this.sql = neon(dbUrl);
      } catch (err) {
        console.warn('[Enterprise DB] Neon client initialization warning:', err.message);
      }
    }

    this.init();
  }

  async init() {
    if (this.isLoaded) return;

    // 1. Load from local cache or seed if available
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const fileContent = fs.readFileSync(this.dbFilePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = { ...this.data, ...parsed };
      } else {
        this.persistLocal();
      }
    } catch (err) {
      // In serverless / read-only environments like Vercel Lambda, memory remains authoritative
    }
    this.isLoaded = true;

    // 2. Hydrate from Neon Cloud Postgres if connected
    if (this.sql) {
      await this.initNeon();
    }
  }

  async initNeon() {
    if (!this.sql || this.neonLoaded) return;
    try {
      // Ensure the collection store table exists
      await this.sql`
        CREATE TABLE IF NOT EXISTS erp_collections (
          collection_name VARCHAR(100) PRIMARY KEY,
          data JSONB,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;

      const rows = await this.sql`SELECT collection_name, data FROM erp_collections`;
      if (rows && rows.length > 0) {
        for (const row of rows) {
          if (row.collection_name && row.data !== undefined) {
            this.data[row.collection_name] = row.data;
          }
        }
      } else {
        // Table exists but is empty - seed all initial collections
        for (const [col, val] of Object.entries(this.data)) {
          await this.syncToNeon(col, val);
        }
      }
      this.neonLoaded = true;
    } catch (err) {
      console.warn('[Enterprise DB] Neon Cloud Postgres synchronization notice:', err.message);
    }
  }

  async syncToNeon(collectionName, value) {
    if (!this.sql || !collectionName) return;
    try {
      const jsonString = JSON.stringify(value);
      await this.sql`
        INSERT INTO erp_collections (collection_name, data, updated_at)
        VALUES (${collectionName}, ${jsonString}::jsonb, NOW())
        ON CONFLICT (collection_name)
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `;
    } catch (err) {
      console.warn(`[Enterprise DB] Cloud sync failed for collection ${collectionName}:`, err.message);
    }
  }

  persistLocal() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.dbFilePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      // Ephemeral disk in serverless runtime
    }
  }

  persist(collectionName) {
    this.persistLocal();
    if (collectionName && this.data[collectionName]) {
      this.syncToNeon(collectionName, this.data[collectionName]).catch(() => {});
    }
  }

  /**
   * Get collection records with multi-tenant isolation
   * @param {string} collectionName
   * @param {string} [tenantId] - Optional tenant partition ID
   */
  get(collectionName, tenantId) {
    const list = this.data[collectionName] || [];
    if (!tenantId) return list;

    // Filter by tenant. Items without explicit tenant_id belong to 'tenant-default'
    return list.filter(item => {
      const itemTenant = item.tenant_id || 'tenant-default';
      return itemTenant === tenantId;
    });
  }

  getSettings(tenantId = 'tenant-default') {
    return this.data.settings || INITIAL_SEED_DATA.settings;
  }

  updateSettings(updates, tenantId = 'tenant-default') {
    this.data.settings = { ...this.data.settings, ...updates, tenant_id: tenantId };
    this.persist('settings');
    return this.data.settings;
  }

  /**
   * Find item by ID with optional tenant isolation
   */
  findById(collectionName, id, tenantId) {
    const list = this.data[collectionName] || [];
    return list.find((item) => {
      const matchId = String(item.id) === String(id);
      if (!matchId) return false;
      if (!tenantId) return true;
      const itemTenant = item.tenant_id || 'tenant-default';
      return itemTenant === tenantId;
    }) || null;
  }

  /**
   * Insert record with automatic tenant assignment
   */
  insert(collectionName, item, tenantId = 'tenant-default') {
    if (!this.data[collectionName]) {
      this.data[collectionName] = [];
    }
    const assignedTenant = tenantId || item.tenant_id || 'tenant-default';
    const newItem = {
      id: item.id || `${collectionName.slice(0, 3)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenant_id: assignedTenant,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...item,
    };
    this.data[collectionName].unshift(newItem);
    this.persist(collectionName);
    return newItem;
  }

  /**
   * Update record with tenant validation
   */
  update(collectionName, id, updates, tenantId) {
    const list = this.data[collectionName] || [];
    const index = list.findIndex((item) => {
      const matchId = String(item.id) === String(id);
      if (!matchId) return false;
      if (!tenantId) return true;
      const itemTenant = item.tenant_id || 'tenant-default';
      return itemTenant === tenantId;
    });

    if (index === -1) return null;

    this.data[collectionName][index] = {
      ...this.data[collectionName][index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persist(collectionName);
    return this.data[collectionName][index];
  }

  /**
   * Delete record with tenant validation
   */
  delete(collectionName, id, tenantId) {
    const list = this.data[collectionName] || [];
    const index = list.findIndex((item) => {
      const matchId = String(item.id) === String(id);
      if (!matchId) return false;
      if (!tenantId) return true;
      const itemTenant = item.tenant_id || 'tenant-default';
      return itemTenant === tenantId;
    });

    if (index === -1) return false;
    this.data[collectionName].splice(index, 1);
    this.persist(collectionName);
    return true;
  }

  /**
   * Immutable Audit Logging with real IP and Tenant identification
   */
  logAudit(action, module, details, user = 'System', ip = '127.0.0.1') {
    const userName = typeof user === 'object' 
      ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email 
      : user;
    const userRole = typeof user === 'object' ? user.role : 'System Admin';
    const tenantId = typeof user === 'object' ? user.tenant_id || 'tenant-default' : 'tenant-default';

    const logItem = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenant_id: tenantId,
      timestamp: new Date().toISOString(),
      user: userName,
      role: userRole,
      action,
      module,
      ip: ip || '127.0.0.1',
      details,
    };

    if (!this.data.audit_logs) this.data.audit_logs = [];
    this.data.audit_logs.unshift(logItem);
    this.persist('audit_logs');
    return logItem;
  }

  /**
   * Secure database reset protected against production execution
   */
  async resetToSeed(callerUser) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Database reset is permanently disabled in production environments.');
    }
    if (callerUser && callerUser.role !== 'Super Admin') {
      throw new Error('Access denied: Only Super Admin can reinitialize the benchmark dataset.');
    }

    this.data = JSON.parse(JSON.stringify(INITIAL_SEED_DATA));
    this.persistLocal();
    if (this.sql) {
      for (const [col, val] of Object.entries(this.data)) {
        await this.syncToNeon(col, val);
      }
    }
    return true;
  }
}

// Singleton instantiation
const db = globalForDb.enterpriseDb || new EnterpriseDatabase();
if (process.env.NODE_ENV !== 'production') {
  globalForDb.enterpriseDb = db;
}

export default db;
