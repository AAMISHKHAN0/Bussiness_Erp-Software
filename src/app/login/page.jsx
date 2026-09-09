'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NexisLogo from '@/components/common/NexisLogo';
import { 
  Lock, Mail, ArrowRight, ShieldCheck, 
  Loader2, UserCheck, Eye, EyeOff, 
  Building2, Activity, Key, CheckCircle2,
  Package, Calculator, Users, Check
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-100 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* =========================================================================
          LEFT SHOWCASE: Solid Slate Panel with Crisp Enterprise Value Architecture
          (100% Solid Colors, Zero Gradients)
          ========================================================================= */}
      <div className="lg:w-1/2 bg-slate-900 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
        {/* Top Header: Monogram Logo & Live Cloud Status */}
        <div className="flex items-center justify-between">
          <NexisLogo size="lg" textLight={true} />
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold">Cloud Production</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-mono text-[11px]">99.99% SLA</span>
          </div>
        </div>

        {/* Center Content: Headline & 3 Solid Feature Bento Pods */}
        <div className="my-10 lg:my-14 space-y-8 max-w-xl">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-900 text-blue-300 border border-blue-800 text-xs font-bold uppercase tracking-wider">
              <span>Enterprise Operating Cloud</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Operational precision for high-velocity commerce.
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Unify multi-warehouse bin inventory, GAAP double-entry general ledger, supplier procurement, and workforce payroll in one verified platform.
            </p>
          </div>

          {/* 3 Solid Pillars of Architecture */}
          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 text-white">
                <Package size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Multi-Warehouse Inventory</h3>
                <p className="text-xs text-slate-400 mt-0.5">Automated SKU tracking, bin location routing, and safety reorder thresholds.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0 text-white">
                <Calculator size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">GAAP Double-Entry Accounting</h3>
                <p className="text-xs text-slate-400 mt-0.5">Automated journal vouchers, real-time balance sheet, and reconciled trial balances.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center flex-shrink-0 text-white">
                <Users size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Workforce & Digital Punch Clock</h3>
                <p className="text-xs text-slate-400 mt-0.5">Verified employee time tracking, department rosters, and automated payroll cycles.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Compliance & Security Tags (100% Solid) */}
        <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="font-semibold text-slate-300">SOC-2 Type II Certified</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">256-Bit AES</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">GAAP Validated</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">v2.5.0</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT AUTH PANEL: Crisp White Minimalist Form Canvas
          (100% Solid Colors, Pure Editorial Minimalism)
          ========================================================================= */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-slate-50">
        <div className="w-full max-w-md space-y-6">
          {/* Card Wrapper with Solid 1px Slate Border */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-xs space-y-6">
            {/* Form Title */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Sign In</h2>
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Enter your corporate credentials to access your operating environment.
              </p>
            </div>

            {/* Solid Segmented Navigation Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('credentials')}
                className={`py-2 px-3 rounded-lg transition-colors text-center ${
                  activeTab === 'credentials'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Account Credentials
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('roles')}
                className={`py-2 px-3 rounded-lg transition-colors text-center ${
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
                {/* 1-Click Demo Pre-fill Box (Solid Blue) */}
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
                  <span className="text-[11px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
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
                    Corporate Email
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
                      Forgot?
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center gap-2 pt-1">
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

                {/* Primary Submit Button (Solid Deep Slate with Pod Icon) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span>Authenticating Credentials...</span>
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
                  Instant one-click access to test role-based permissions and module workflows:
                </p>

                {[
                  {
                    role: 'Admin',
                    title: 'Chief Executive / Platform Admin',
                    subtitle: 'Full unconstrained system governance',
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

          {/* Bottom Security Note */}
          <div className="text-center text-xs text-slate-500 space-y-1">
            <p>Protected by 256-bit TLS enterprise security and OAuth token encryption.</p>
            <p className="text-[11px] text-slate-400">Nexis ERP Platform · All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
