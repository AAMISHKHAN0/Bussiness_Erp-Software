import { ApiError } from '../utils/ApiError';
import fs from 'fs';
import path from 'path';

// Support both development and production paths
const LICENSE_FILE_PATH = process.env.LICENSE_FILE_PATH 
    || path.join(process.cwd(), 'license.json');

const MS_DAY = 86400000;

interface LicenseKeyInfo {
    tier: string;
    duration: number;
    used: boolean;
}

/**
 * Pre-generated keys with tiers.
 * In Phase 2, these will be migrated to the PostgreSQL 'licenses' table.
 */
const LICENSE_KEYS: Record<string, LicenseKeyInfo> = {
    // Demo/Development Key (from README)
    'YER-A1B2-C3D4-E5F6': { tier: '1 Year', duration: MS_DAY * 365, used: false },
    // New 2026 Premium Keys
    'COMPANY1-ERP-KEY': { tier: '1 Year', duration: MS_DAY * 365, used: false },
    'COMPANY2-ERP-KEY': { tier: '1 Year', duration: MS_DAY * 365, used: false },
    // Additional tier keys
    'DAY-TEST-KEY-001': { tier: 'Day', duration: MS_DAY * 1, used: false },
    'MONTH-TEST-KEY-001': { tier: 'Month', duration: MS_DAY * 30, used: false },
    'QUARTER-TEST-KEY-001': { tier: 'Quarter', duration: MS_DAY * 90, used: false },
};

export class LicenseService {
    /**
     * Get active license status
     */
    static getStatus() {
        if (!fs.existsSync(LICENSE_FILE_PATH)) {
            return { active: false, tier: null, expiresAt: null };
        }
        try {
            const data = JSON.parse(fs.readFileSync(LICENSE_FILE_PATH, 'utf-8'));
            if (data.expiresAt && data.expiresAt > Date.now()) {
                return { active: true, tier: data.tier, expiresAt: data.expiresAt };
            }
            return { active: false, tier: data.tier, expiresAt: data.expiresAt };
        } catch (e) {
            return { active: false, tier: null, expiresAt: null };
        }
    }

    /**
     * Activate a license key
     */
    static async activateKey(key: string) {
        if (!key) {
            throw ApiError.badRequest('Activation key is required');
        }

        const normalizedKey = key.trim().toUpperCase();
        const license = LICENSE_KEYS[normalizedKey];

        if (!license) {
            console.warn(`[LICENSE] Activation failed: Invalid key tried: ${normalizedKey}`);
            throw ApiError.badRequest('Invalid activation key');
        }

        if (license.used) {
            throw ApiError.badRequest('This key has already been used');
        }

        // Mark key as consumed
        license.used = true;

        const expiresAt = Date.now() + license.duration;

        // Persist to file
        fs.writeFileSync(LICENSE_FILE_PATH, JSON.stringify({
            key: normalizedKey,
            tier: license.tier,
            expiresAt,
            activatedAt: Date.now()
        }, null, 2));

        return {
            tier: license.tier,
            duration: license.duration,
            expiresAt,
        };
    }

    /**
     * Get all license keys status (Admin Only)
     */
    static async getAllKeys() {
        return Object.entries(LICENSE_KEYS).map(([key, info]) => ({
            key,
            tier: info.tier,
            used: info.used,
        }));
    }
}
