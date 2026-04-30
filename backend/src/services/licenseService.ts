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
    // 2026 Premium Keys
    'YER-A1B2-C3D4-E5F6': { tier: '1 Year', duration: MS_DAY * 365, used: true },
    'YER-K8L9-M0N1-P2Q3': { tier: '1 Year', duration: MS_DAY * 365, used: false },
    'YER-R4S5-T6U7-V8W9': { tier: '1 Year', duration: MS_DAY * 365, used: false },
    'MON-B2C3-D4E5-F6G7': { tier: '1 Month', duration: MS_DAY * 30, used: false },
    'MON-H8I9-J0K1-L2M3': { tier: '1 Month', duration: MS_DAY * 30, used: false },
    'DAY-Z1X2-C3V4-B5N6': { tier: '1 Day', duration: MS_DAY * 1, used: false },
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
