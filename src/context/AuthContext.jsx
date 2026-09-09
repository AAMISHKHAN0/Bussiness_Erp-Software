'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check saved session or initialize default
    const saved = localStorage.getItem('apex_erp_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        setUser(null);
      }
    } else {
      // Default to Super Admin for seamless initial access
      const defaultUser = {
        id: "u-1",
        email: "admin@company.com",
        first_name: "Alexander",
        last_name: "Sterling",
        role: "Super Admin",
        department: "Executive Board",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&auto=format&fit=crop&q=80"
      };
      setUser(defaultUser);
      localStorage.setItem('apex_erp_user', JSON.stringify(defaultUser));
    }
    setLoading(false);
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
      return json;
    }
    throw new Error(json.message || 'Login failed');
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
      return json;
    }
    throw new Error(json.message || 'Role switch failed');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('apex_erp_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
