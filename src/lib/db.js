import fs from 'fs';
import path from 'path';
import { INITIAL_SEED_DATA } from './seedData.js';

// Global reference to preserve database state across Next.js hot-reloads
const globalForDb = globalThis;

class EnterpriseDatabase {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.dbFilePath = path.join(this.dataDir, 'erp_database.json');
    this.isLoaded = false;
    this.data = JSON.parse(JSON.stringify(INITIAL_SEED_DATA));
    this.init();
  }

  init() {
    if (this.isLoaded) return;
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const fileContent = fs.readFileSync(this.dbFilePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = { ...this.data, ...parsed };
      } else {
        this.persist();
      }
    } catch (err) {
      console.warn('[Enterprise DB] Disk persistence notice:', err.message);
    }
    this.isLoaded = true;
  }

  persist() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.dbFilePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      // In serverless / read-only environments like Vercel Lambda, memory remains authoritative
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
    this.persist();
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
    this.persist();
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
    this.persist();
    return this.data[collectionName][index];
  }

  delete(collectionName, id) {
    const list = this.get(collectionName);
    const index = list.findIndex((item) => String(item.id) === String(id));
    if (index === -1) return false;
    this.data[collectionName].splice(index, 1);
    this.persist();
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
    this.persist();
    return logItem;
  }

  resetToSeed() {
    this.data = JSON.parse(JSON.stringify(INITIAL_SEED_DATA));
    this.persist();
    return true;
  }
}

// Singleton instantiation
const db = globalForDb.enterpriseDb || new EnterpriseDatabase();
if (process.env.NODE_ENV !== 'production') {
  globalForDb.enterpriseDb = db;
}

export default db;
