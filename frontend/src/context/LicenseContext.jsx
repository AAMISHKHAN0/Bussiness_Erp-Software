import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const LicenseContext = createContext(null);

export const useLicense = () => {
    const context = useContext(LicenseContext);
    if (!context) {
        throw new Error('useLicense must be used within a LicenseProvider');
    }
    return context;
};

export const LicenseProvider = ({ children }) => {
    const [expiresAt, setExpiresAt] = useState(() => {
        const stored = localStorage.getItem('license_expiry');
        return stored ? parseInt(stored, 10) : null;
    });
    const [tier, setTier] = useState(() => localStorage.getItem('license_tier') || null);
    const [remainingMs, setRemainingMs] = useState(0);
    const [activating, setActivating] = useState(false);

    // Compute whether the license is currently active
    const isLicenseActive = expiresAt !== null && expiresAt > Date.now();

    // Verify license with backend on mount
    useEffect(() => {
        const verifyLicense = async () => {
            try {
                const res = await api.get('/license/status');
                const data = res.data.data;
                if (data.active) {
                    setExpiresAt(data.expiresAt);
                    setTier(data.tier);
                    localStorage.setItem('license_expiry', String(data.expiresAt));
                    localStorage.setItem('license_tier', data.tier);
                } else {
                    setExpiresAt(null);
                    setTier(null);
                    localStorage.removeItem('license_expiry');
                    localStorage.removeItem('license_tier');
                }
            } catch (err) {
                // Suppress error if backend is offline - AuthContext will handle that warning
                if (err.code !== 'ERR_NETWORK' && !err.message?.includes('Network Error')) {
                    console.error("Failed to verify license status", err);
                }
            }
        };
        verifyLicense();
    }, []);

    // Countdown timer — ticks every second
    useEffect(() => {
        if (!expiresAt) return;

        const tick = () => {
            const diff = expiresAt - Date.now();
            if (diff <= 0) {
                setRemainingMs(0);
                // License expired — do NOT clear data, just stop access
            } else {
                setRemainingMs(diff);
            }
        };

        tick(); // immediate
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    // Format remaining time for display
    const formatRemaining = useCallback(() => {
        if (remainingMs <= 0) return '00:00:00';

        const totalSeconds = Math.floor(remainingMs / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const pad = (n) => String(n).padStart(2, '0');

        if (days > 0) {
            return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
        }
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }, [remainingMs]);

    // Activate a license key
    const activateLicense = async (key) => {
        setActivating(true);
        try {
            const res = await api.post('/license/activate', { key });
            const { tier: newTier, expiresAt: newExpiry } = res.data.data;

            localStorage.setItem('license_expiry', String(newExpiry));
            localStorage.setItem('license_tier', newTier);

            setExpiresAt(newExpiry);
            setTier(newTier);
            setRemainingMs(newExpiry - Date.now());

            return { success: true, message: res.data.message, tier: newTier };
        } catch (err) {
            const msg = err.response?.data?.message || 'Activation failed';
            
            // If the key was already used, it might be because the user activated it but refreshed
            if (msg.includes('already been used')) {
                // Manually trigger a status check if needed
                window.location.reload(); 
            }

            return {
                success: false,
                message: msg
            };
        } finally {
            setActivating(false);
        }
    };

    const value = {
        isLicenseActive,
        expiresAt,
        tier,
        remainingMs,
        remainingFormatted: formatRemaining(),
        activateLicense,
        activating,
    };

    return (
        <LicenseContext.Provider value={value}>
            {children}
        </LicenseContext.Provider>
    );
};

export default LicenseContext;
