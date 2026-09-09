'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NexisLogo from '@/components/common/NexisLogo';
import { 
  Lock, Mail, ArrowRight, ShieldCheck, 
  Loader2, Eye, EyeOff, 
  Building2, Key, CheckCircle2,
  Package, Calculator, Users, Check, Sparkles
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchRole } = useAuth();
  
  // Tab switcher: 'credentials' | 'roles'
  const [activeTab, setActiveTab] = useState('credentials');
  
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
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
      setError(err.message || 'Role switch failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillAdmin = () => {
    setEmail('admin@company.com');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen w-full bg-[#090D16] flex flex-col justify-start items-center p-4 sm:p-6 sm:py-10 overflow-y-auto selection:bg-blue-600 selection:text-white">
      {/* Scrollable Content Container with my-auto for flawless vertical centering & scrollability */}
      <div className="w-full max-w-lg my-auto py-6 flex flex-col items-center">
        {/* Brand Header */}
        <div className="w-full mb-6 flex flex-col items-center text-center space-y-3">
          <NexisLogo size="lg" textLight={true} />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#131B2E] border border-[#1E293B] text-[11px] font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>Cloud Network Operational</span>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-slate-400">99.99% SLA</span>
          </div>
        </div>

        {/* Central Login Card (100% Solid Colors, Clean Architectural Surface) */}
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-9 space-y-6">
          {/* Card Title & Intro */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Sign In to Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Enter your credentials to access your enterprise operating environment.
            </p>
          </div>

          {/* Solid Segmented Navigation Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('credentials')}
              className={`py-2 px-3 rounded-lg transition-colors text-center cursor-pointer ${
                activeTab === 'credentials'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Direct Account Login
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('roles')}
              className={`py-2 px-3 rounded-lg transition-colors text-center cursor-pointer ${
                activeTab === 'roles'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1-Click Role Switcher
            </button>
          </div>

          {/* TAB 1: STANDARD CREDENTIALS */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1-Click Demo Pre-fill Banner (Solid Blue Surface) */}
              <div 
                onClick={handleFillAdmin}
                className="p-3 rounded-xl bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors flex items-center justify-between"
                title="Click to auto-fill Administrator credentials"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    A
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-900">Demo Administrator Account</p>
                    <p className="text-[10px] font-mono text-blue-700">admin@company.com · password123</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded border border-blue-200 shadow-2xs">
                  Auto-Fill
                </span>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Corporate Email Field */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider">
                  Corporate Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
                  />
                </div>
              </div>

              {/* Secure Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                    Forgot Password?
                  </span>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="remember" className="text-xs font-semibold text-slate-600 cursor-pointer">
                    Remember this workstation for 30 days
                  </label>
                </div>
              </div>

              {/* Primary Submit Button (Solid Deep Charcoal with Icon Pod) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Authenticating Session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Operating Cloud</span>
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                      <ArrowRight size={12} />
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: 1-CLICK ROLE DEMO PORTAL */}
          {activeTab === 'roles' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-medium pb-1">
                Select an enterprise role below for instant authenticated access:
              </p>

              {[
                {
                  role: 'Admin',
                  title: 'Chief Executive / Platform Admin',
                  subtitle: 'Full unconstrained system governance & analytics',
                  badge: 'Full Access',
                  color: 'bg-blue-600',
                  email: 'admin@company.com'
                },
                {
                  role: 'Accountant',
                  title: 'Financial Controller',
                  subtitle: 'GAAP Chart of Accounts, Vouchers & Balance Sheet',
                  badge: 'Financial Ledger',
                  color: 'bg-emerald-600',
                  email: 'accountant@company.com'
                },
                {
                  role: 'Warehouse',
                  title: 'Inventory & Warehouse Director',
                  subtitle: 'SKU allocations, stock levels & reorders',
                  badge: 'Supply Chain',
                  color: 'bg-amber-600',
                  email: 'warehouse@company.com'
                },
                {
                  role: 'HR',
                  title: 'Human Resources & Payroll',
                  subtitle: 'Employee roster, punch clock & compensation',
                  badge: 'Workforce',
                  color: 'bg-purple-600',
                  email: 'hr@company.com'
                },
              ].map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleQuickRole(item.role)}
                  disabled={loading}
                  className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-600 transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${item.color} text-white flex items-center justify-center font-bold text-xs flex-shrink-0`}>
                      {item.role.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-500">{item.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                    {item.badge}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Trust & Compliance Badges */}
        <div className="w-full max-w-lg mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>SOC-2 Type II Certified</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>256-Bit TLS Security</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>GAAP General Ledger Validated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
