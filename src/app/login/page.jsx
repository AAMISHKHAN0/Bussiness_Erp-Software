'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NexisLogo from '@/components/common/NexisLogo';
import { 
  Lock, Mail, ArrowRight, ShieldCheck, 
  Loader2, Eye, EyeOff, Package, Landmark, 
  TrendingUp, Layers, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchRole } = useAuth();
  
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both work email and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      // Enterprise security: Never expose backend internal query/database errors
      const sanitized = err.message && !err.message.toLowerCase().includes('database') && !err.message.toLowerCase().includes('sql')
        ? err.message
        : 'Invalid work email or password. Please check your credentials.';
      setError(sanitized);
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
      setError('Unable to authenticate role switch session.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setForgotSent(true);
    setTimeout(() => setForgotSent(false), 5000);
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col lg:flex-row selection:bg-blue-600 selection:text-white">
      {/* =========================================================================
          LEFT PANEL: NEXIS ENTERPRISE BRANDING & ARCHITECTURE
          ========================================================================= */}
      <div className="lg:w-1/2 bg-[#0F172A] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden text-white border-b lg:border-b-0 lg:border-r border-slate-800">
        {/* Subtle Brand Lighting in Background (professional, not flashy) */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

        {/* Brand Header */}
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <NexisLogo size="lg" textLight={true} />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] font-mono font-medium text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operational v2.4
            </span>
          </div>
          <div className="pt-2">
            <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              Enterprise Operating Cloud
            </span>
          </div>
        </div>

        {/* Narrative & Enterprise Features */}
        <div className="relative z-10 py-10 lg:py-16 space-y-8">
          <div className="space-y-4 max-w-lg">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              Run your business with clarity, control and confidence.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              A single unified system orchestrating multi-facility warehouse stock, GAAP general ledger liquidity, commercial sales pipelines, and payroll governance.
            </p>
          </div>

          {/* 4 Subtle Enterprise Feature Indicators */}
          <div className="grid grid-cols-2 gap-3 max-w-lg pt-2">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 shrink-0">
                <Package size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Inventory</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Multi-warehouse SKU tracking & alerts</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 shrink-0">
                <Landmark size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Finance</p>
                <p className="text-[10px] text-slate-400 mt-0.5">GAAP chart of accounts & liquidity</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 shrink-0">
                <TrendingUp size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Sales</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Commercial fulfillment & invoicing</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-600/20 text-amber-400 shrink-0">
                <Layers size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Operations</p>
                <p className="text-[10px] text-slate-400 mt-0.5">HR workforce, audits & role RBAC</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Security / Trust Standards */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-400" />
            <span>SOC-2 Type II Certified</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
            <span>TLS 1.3 Encryption</span>
            <span>·</span>
            <span>99.99% Cloud SLA</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANEL: CLEAN LOGIN CARD
          ========================================================================= */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-[#F8FAFC]">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile-only logo display */}
          <div className="lg:hidden flex justify-center pb-2">
            <NexisLogo size="md" />
          </div>

          {/* Clean Enterprise Login Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7 sm:p-9 space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Welcome back
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Sign in to your NEXIS workspace
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
                <AlertCircle size={16} className="text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Forgot Password Feedback */}
            {forgotSent && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                <span>Password recovery instructions dispatched to registered email.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Work Email Field */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="work-email" 
                  className="block text-slate-700 text-xs font-bold uppercase tracking-wider"
                >
                  Work email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="work-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-colors"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label 
                    htmlFor="work-password" 
                    className="block text-slate-700 text-xs font-bold uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="work-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-600">
                    Remember me
                  </span>
                </label>
              </div>

              {/* Primary Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Assistant */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <p className="text-[11px] font-semibold text-slate-500 text-center">
                Demo Workspace Quick Access:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@company.com');
                    setPassword('password123');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-left transition-colors cursor-pointer"
                >
                  <p className="text-[10px] font-bold text-slate-800">Admin</p>
                  <p className="text-[9px] font-mono text-slate-500 truncate">admin@company.com</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('accountant@company.com');
                    setPassword('password123');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-left transition-colors cursor-pointer"
                >
                  <p className="text-[10px] font-bold text-slate-800">Accountant</p>
                  <p className="text-[9px] font-mono text-slate-500 truncate">accountant@company.com</p>
                </button>
              </div>
            </div>

            {/* Secure Enterprise Access Indicator */}
            <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-slate-400 font-medium">
              <ShieldCheck size={14} className="text-blue-600" />
              <span>Secure enterprise access</span>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400">
            NEXIS ERP Systems &middot; Enterprise Operating Cloud &middot; All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
