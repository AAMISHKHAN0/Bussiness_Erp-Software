import { AuditRepository } from '../repositories/auditRepository';
import { logger } from '../utils/logger';
import { Pool } from "pg";

// In-memory settings store (Standardize settings persistent store layer in Phase 2)
let settingsStore = {
    company_name: 'Kinetic Vault ERP',
    company_email: 'admin@kineticvault.com',
    company_phone: '+1 (555) 123-4567',
    address: '123 Tech Avenue, SP',
    currency: 'USD',
    timezone: 'UTC',
    logo_url: null
};

export class AdminService {
    /**
     * Get system settings
     */
    static async getSettings(db: Pool) {
        return settingsStore;
    }

    /**
     * Update system settings
     */
    static async updateSettings(db: Pool, newSettings: any, userId: string) {
        settingsStore = {
            ...settingsStore,
            ...newSettings
        };

        logger.info('System settings updated', { userId, settings: settingsStore });
        
        // Log action to audit logs
        await AuditRepository.create(db, {
            user_id: userId,
            action: 'UPDATE_SETTINGS',
            resource: 'SYSTEM_SETTINGS',
            details: settingsStore
        });

        return settingsStore;
    }

    /**
     * Get recent audit logs
     */
    static async getAuditLogs(db: Pool, limit: number = 50) {
        return await AuditRepository.findRecent(db, limit);
    }

    /**
     * Get system health metrics
     */
    static async getSystemHealth(db: Pool) {
        return {
            status: 'Healthy',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            node_version: process.version,
            platform: process.platform,
            timestamp: new Date().toISOString()
        };
    }
}
