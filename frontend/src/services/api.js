import axios from 'axios';

// VPS/Production compatible API URL configuration
const getApiUrl = () => {
    // Priority: env var > auto-detect from current host > fallback
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    
    // In production/VPS, API is usually at same domain or /api path
    const { protocol, hostname, port } = window.location;
    
    // If running on localhost, use port 5000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://localhost:5000/api`;
    }
    
    // Production: API at same domain /api path or subdomain
    // Check if we're on a specific port (dev) or standard ports
    if (port && port !== '80' && port !== '443') {
        return `${protocol}//${hostname}:5000/api`;
    }
    
    // Standard production setup: API served at /api or separate subdomain
    return `${protocol}//${hostname}/api`;
};

const API_URL = getApiUrl();
export const RESOURCES_URL = import.meta.env.VITE_RESOURCES_URL || API_URL.replace('/api', '');

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000, // Increased for production/VPS latency
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach JWT token and tenant
api.interceptors.request.use(
    (config) => {
        // Auto-detect Tenant from Subdomain (e.g., tenant.example.com)
        const host = window.location.hostname;
        const parts = host.split('.');
        
        // Check if subdomain is present (tenant.domain.com)
        if (parts.length > 2 && !host.includes('localhost')) {
             config.headers['x-tenant-id'] = parts[0];
        } else if (host === 'localhost' && parts.length === 2 && parts[1] === 'localhost') {
             // localhost with subdomain pattern (tenant.localhost)
             config.headers['x-tenant-id'] = parts[0];
        } else {
             // Fallback to localStorage or env-configured tenant
             const manualTenant = localStorage.getItem('erp_tenant_id') || import.meta.env.VITE_DEFAULT_TENANT;
             if (manualTenant) config.headers['x-tenant-id'] = manualTenant;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

let refreshPromise = null;

// Response interceptor — handle token refresh, errors, and network issues
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle network errors (backend down, CORS, etc.)
        if (!error.response) {
            console.error('[API] Network error - Backend may be unavailable:', error.message);
            
            // Don't redirect on login page to show error message
            if (window.location.pathname !== '/login') {
                // Could show a toast/notification here
            }
            return Promise.reject(error);
        }

        // Handle 401 — token expired
        const isAuthRequest = 
            originalRequest.url?.includes('/auth/refresh') || 
            originalRequest.url?.includes('/auth/logout') ||
            originalRequest.url?.includes('/auth/login');
            
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
            originalRequest._retry = true;

            try {
                // Get current tenant headers
                const tenantHeaders = {};
                if (originalRequest.headers['x-tenant-id']) {
                    tenantHeaders['x-tenant-id'] = originalRequest.headers['x-tenant-id'];
                }

                // If a refresh is not already in progress, start one
                if (!refreshPromise) {
                    refreshPromise = axios.post(`${API_URL}/auth/refresh`, {}, { 
                        withCredentials: true,
                        headers: tenantHeaders,
                        timeout: 10000
                    });
                }
                
                // Wait for the refresh (whether we started it or another request did)
                await refreshPromise;
                
                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh token failed or expired — force logout
                try { 
                    const tenantHeaders = {};
                    if (originalRequest.headers['x-tenant-id']) {
                        tenantHeaders['x-tenant-id'] = originalRequest.headers['x-tenant-id'];
                    }
                    await axios.post(`${API_URL}/auth/logout`, {}, { 
                        withCredentials: true,
                        headers: tenantHeaders,
                        timeout: 5000
                    }); 
                } catch(e) {
                    // Ignore logout errors
                }
                
                // Clear auth state
                localStorage.removeItem('license_expiry');
                localStorage.removeItem('license_tier');
                
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login?session=expired';
                }
                return Promise.reject(refreshError);
            } finally {
                // Clear the promise when done to allow future token refreshes
                refreshPromise = null;
            }
        }
        
        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            console.warn('[API] Access forbidden:', error.response.data?.message);
        }
        
        // Handle 500+ Server errors
        if (error.response?.status >= 500) {
            console.error('[API] Server error:', error.response.data?.message || 'Unknown server error');
        }

        return Promise.reject(error);
    }
);

export default api;
