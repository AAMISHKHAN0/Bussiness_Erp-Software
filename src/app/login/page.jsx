'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Lock, Mail, ArrowRight, ShieldCheck, 
  Loader2, UserCheck, CheckCircle2, Building2
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchRole } = useAuth();
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = async (roleName) => {
    setLoading(true);
    setError('');
    try {
      await switchRole(roleName);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900">
      {/* Left Corporate Branding Showcase */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between bg-blue-600 text-white relative">
        {/* Top Brand */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white text-blue-600 flex items-center justify-center font-black text-2xl shadow-sm">
            G
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-white">Global Enterprise ERP</h1>
            <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Cloud Enterprise Suite</p>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="my-12 lg:my-0 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 text-white text-xs font-semibold">
            <Building2 size={14} />
            <span>Integrated Business Management Suite</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            The reliable operating system for modern enterprise operations.
          </h2>

          <p className="text-blue-100 text-sm lg:text-base leading-relaxed">
            Unify multi-warehouse inventory, GAAP double-entry general ledger, supplier procurement, customer accounts, and biometric employee attendance — completely native in Next.js for high-speed cloud performance.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3 bg-blue-700/50 rounded-lg border border-blue-400/30">
              <p className="text-2xl font-black text-white">GAAP</p>
              <p className="text-xs text-blue-100 font-medium">Double-Entry</p>
            </div>
            <div className="p-3 bg-blue-700/50 rounded-lg border border-blue-400/30">
              <p className="text-2xl font-black text-white">100%</p>
              <p className="text-xs text-blue-100 font-medium">Vercel Ready</p>
            </div>
            <div className="p-3 bg-blue-700/50 rounded-lg border border-blue-400/30">
              <p className="text-2xl font-black text-white">Real-Time</p>
              <p className="text-xs text-blue-100 font-medium">Stock Sync</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-blue-100 flex items-center gap-2">
          <ShieldCheck size={16} className="text-white" />
          <span>Enterprise Transaction Security · Role-Based Access Control</span>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left space-y-1.5">
            <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">Sign in to your account</h3>
            <p className="text-xs text-slate-500">Enter your enterprise credentials or select an executive demo role.</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* 1-Click Role Switcher Demo Buttons */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <UserCheck size={14} className="text-blue-600" />
              <span>1-Click Role Demo Sign In:</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Super Admin', subtitle: 'Executive Control' },
                { name: 'Financial Controller', subtitle: 'GAAP General Ledger' },
                { name: 'Inventory Specialist', subtitle: 'Stock & Warehouse' },
                { name: 'HR Director', subtitle: 'Staff & Payroll' },
              ].map((role) => (
                <button
                  key={role.name}
                  type="button"
                  onClick={() => handleQuickRole(role.name)}
                  disabled={loading}
                  className="p-2.5 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-lg text-left transition-all text-xs group active:scale-95 shadow-2xs"
                >
                  <p className="font-bold text-slate-800 group-hover:text-blue-700 truncate">{role.name}</p>
                  <p className="text-[10px] text-slate-500 group-hover:text-blue-600 truncate">{role.subtitle}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Or Use Email & Password
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500">
            <p>System Administrator Support: <strong className="text-slate-700">contact@globalenterprise.com</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
