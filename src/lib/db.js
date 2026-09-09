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

  get(collectionName) {
    return this.data[collectionName] || [];
  }

  getSettings() {
    return this.data.settings || INITIAL_SEED_DATA.settings;
  }

  updateSettings(updates) {
    this.data.settings = { ...this.data.settings, ...updates };
    this.persist('settings');
    return this.data.settings;
  }

  findById(collectionName, id) {
    const list = this.get(collectionName);
    return list.find((item) => String(item.id) === String(id)) || null;
  }

  insert(collectionName, item) {
    if (!this.data[collectionName]) {
      this.data[collectionName] = [];
    }
    const newItem = {
      id: item.id || `${collectionName.slice(0, 3)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...item,
    };
    this.data[collectionName].unshift(newItem);
    this.persist(collectionName);
    return newItem;
  }

  update(collectionName, id, updates) {
    const list = this.get(collectionName);
    const index = list.findIndex((item) => String(item.id) === String(id));
    if (index === -1) return null;

    this.data[collectionName][index] = {
      ...this.data[collectionName][index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persist(collectionName);
    return this.data[collectionName][index];
  }

  delete(collectionName, id) {
    const list = this.get(collectionName);
    const index = list.findIndex((item) => String(item.id) === String(id));
    if (index === -1) return false;
    this.data[collectionName].splice(index, 1);
    this.persist(collectionName);
    return true;
  }

  logAudit(action, module, details, user = 'System') {
    const logItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: typeof user === 'object' ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : user,
      role: typeof user === 'object' ? user.role : 'System Admin',
      action,
      module,
      ip: '127.0.0.1',
      details,
    };
    if (!this.data.audit_logs) this.data.audit_logs = [];
    this.data.audit_logs.unshift(logItem);
    this.persist('audit_logs');
    return logItem;
  }

  async resetToSeed() {
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
