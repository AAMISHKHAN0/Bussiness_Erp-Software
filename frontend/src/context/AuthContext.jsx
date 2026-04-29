import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [backendOnline, setBackendOnline] = useState(true);

    const normalizeUser = (userData) => {
        if (!userData) return null;

        const firstName = userData.firstName || userData.first_name || '';
        const lastName = userData.lastName || userData.last_name || '';
        const name = userData.name || `${firstName} ${lastName}`.trim() || userData.email || 'Admin';

        return {
            ...userData,
            firstName,
            lastName,
            name,
            permissions: Array.isArray(userData.permissions) ? userData.permissions : [],
        };
    };

    useEffect(() => {
        const initAuth = async () => {
            // BUGFIX: Skip auto-load if we are already on the login page to avoid redirect loops
            if (window.location.pathname === '/login') {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get('/auth/me');
                if (response.data.success) {
                    setUser(normalizeUser(response.data.data));
                }
            } catch (error) {
                if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
                    console.warn('Backend server is not running. Please start the backend server.');
                    setBackendOnline(false);
                } else if (error.response?.status === 401) {
                    console.warn('No active session found. Please log in.');
                } else {
                    console.warn('Auth check failed:', error.message);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { user: userData } = response.data.data;

        const normalizedUser = normalizeUser(userData);
        setUser(normalizedUser);
        return normalizedUser;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            window.location.href = '/login';
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        backendOnline,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
