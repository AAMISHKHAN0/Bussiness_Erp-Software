'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ROLE_PERMISSIONS, hasPermission as checkPermission } from '@/lib/permissions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check saved session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await fetch('/api/auth');
        const json = await res.json();
        if (json.success && json.user) {
          setUser(json.user);
          localStorage.setItem('apex_erp_user', JSON.stringify(json.user));
        } else {
          // Check local cache
          const saved = localStorage.getItem('apex_erp_user');
          if (saved) {
            setUser(JSON.parse(saved));
          } else {
            setUser(null);
          }
        }
      } catch (e) {
        const saved = localStorage.getItem('apex_erp_user');
        if (saved) {
          try { setUser(JSON.parse(saved)); } catch {}
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (json.success && json.user) {
      setUser(json.user);
      localStorage.setItem('apex_erp_user', JSON.stringify(json.user));
      if (json.token) {
        localStorage.setItem('nexis_token', json.token);
        document.cookie = `nexis_token=${json.token}; path=/; max-age=604800; SameSite=Lax`;
      }
      return json;
    }
    throw new Error(json.message || 'Authentication failed');
  };

  const switchRole = async (roleName) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'switch-role', role: roleName })
    });
    const json = await res.json();
    if (json.success && json.user) {
      setUser(json.user);
      localStorage.setItem('apex_erp_user', JSON.stringify(json.user));
      if (json.token) {
        localStorage.setItem('nexis_token', json.token);
        document.cookie = `nexis_token=${json.token}; path=/; max-age=604800; SameSite=Lax`;
      }
      return json;
    }
    throw new Error(json.message || 'Role switch failed');
  };

  const logout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      });
    } catch (e) {}
    setUser(null);
    localStorage.removeItem('apex_erp_user');
    localStorage.removeItem('nexis_token');
    document.cookie = 'nexis_token=; path=/; max-age=0; SameSite=Lax';
  };

  const hasPermission = (requiredPermission) => {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return checkPermission(permissions, requiredPermission);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, switchRole, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
