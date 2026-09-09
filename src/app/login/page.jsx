'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NexisLogo from '@/components/common/NexisLogo';
import { 
  Lock, Mail, ArrowRight, ShieldCheck, 
  Loader2, UserCheck, Eye, EyeOff, 
  Building2, Activity, Key, CheckCircle2,
  TrendingUp, Award, Laptop, Sparkles
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

  const handleFillAdmin = () => {
    setEmail('admin@company.com');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
      {/* =========================================================================
          LEFT SHOWCASE: Executive Brand Canvas with Glassmorphic Live Card
          ========================================================================= */}
      <div className="lg:w-7/12 relative overflow-hidden bg-slate-950 text-white p-8 lg:p-16 flex flex-col justify-between">
        {/* Subtle Ambient Radial Gradients */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

        {/* Top Header: Brand Lettermark Logo & System Pulse */}
        <div className="relative z-10 flex items-center justify-between">
          <NexisLogo size="lg" textLight={true} />
          
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300 backdrop-blur-md shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-slate-200">System Operational</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-mono text-[11px]">99.99% SLA</span>
          </div>
        </div>

        {/* Center Hero: Vision Headline & Glassmorphism KPI Dashboard */}
        <div className="relative z-10 my-10 lg:my-0 max-w-xl space-y-7">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold backdrop-blur-sm">
            <Sparkles size={14} className="text-blue-400" />
            <span>Next-Generation Enterprise Architecture (2024–2028)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]">
            The intelligent operating system for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">modern enterprise</span> scale.
          </h1>

          <p className="text-slate-300 text-sm lg:text-base leading-relaxed">
            Unify multi-warehouse bin inventory, GAAP double-entry general ledger, supplier procurement, customer accounts, and real-time cloud analytics — engineered natively in Next.js for zero latency.
          </p>

          {/* Floating Glassmorphic Live Operational Showcase Card */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-blue-400" />
                <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Live Enterprise Throughput</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                ● Live Sync Active
              </span>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Gross Volume</p>
                <p className="text-lg font-extrabold text-white mt-0.5">$1.48M</p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-0.5 font-semibold">
                  <TrendingUp size={11} />
                  <span>+14.2% MoM</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Active Hardware</p>
                <p className="text-lg font-extrabold text-white mt-0.5">8,420</p>
                <p className="text-[10px] text-blue-400 mt-0.5 font-medium">99.8% in stock</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Fulfillment SLA</p>
                <p className="text-lg font-extrabold text-white mt-0.5">2.4 hrs</p>
                <p className="text-[10px] text-emerald-400 mt-0.5 font-medium">Auto-Restocked</p>
              </div>
            </div>

            {/* Mini Activity Line */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
              <span className="truncate">
                <strong className="text-slate-200">SO-2026-9182:</strong> HPE ProLiant Cluster ($36,661.25)
              </span>
              <span className="text-emerald-400 font-bold ml-2 flex-shrink-0">Settled ACH</span>
            </div>
          </div>
        </div>

        {/* Bottom Security Credentials Bar */}
        <div className="relative z-10 pt-6 border-t border-slate-900 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck size={14} className="text-blue-400" />
              SOC-2 Type II Certified
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Award size={14} className="text-blue-400" />
              GAAP Standard Compliant
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Lock size={14} className="text-blue-400" />
              AES-256 Vault
            </span>
          </div>
          <span className="text-slate-500 font-mono text-[10px]">v2.5.0 · Cloud Edition</span>
        </div>
      </div>

      {/* =========================================================================
          RIGHT LOGIN PANEL: Clean, High-Conversion Enterprise Authentication Card
          ========================================================================= */}
      <div className="lg:w-5/12 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-md space-y-7">
          {/* Header Title & Subtitle */}
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Sign in to Nexis
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Access your corporate workstation and executive dashboards.
            </p>
          </div>

          {/* Segmented Tab Control: Corporate Credentials vs Department Portal */}
          <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('credentials')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'credentials'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Key size={14} className={activeTab === 'credentials' ? 'text-blue-600' : ''} />
              <span>Corporate Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('roles')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'roles'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck size={14} className={activeTab === 'roles' ? 'text-blue-600' : ''} />
              <span>Department Portal</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: Standard Corporate Email & Password */}
          {activeTab === 'credentials' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Corporate Email</label>
                  <button
                    type="button"
                    onClick={handleFillAdmin}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Use Admin Login
                  </button>
                </div>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <span className="text-[11px] text-slate-400">Default: password123</span>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter security key..."
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Workstation & Reset */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">Remember workstation</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('For password recovery, contact your corporate systems administrator at admin@company.com')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Forgot key?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Nexis Console</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* TAB 2: Department Portal 1-Click Executive Access */
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-medium">
                Select your assigned department to authenticate with role-scoped permissions:
              </p>

              <div className="space-y-2">
                {[
                  { 
                    role: 'Super Admin', 
                    dept: 'Executive Leadership', 
                    tag: 'Full Authority', 
                    tagColor: 'bg-purple-50 text-purple-700 border-purple-200' 
                  },
                  { 
                    role: 'Financial Controller', 
                    dept: 'Finance & Accounting', 
                    tag: 'GAAP Ledger', 
                    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  },
                  { 
                    role: 'Inventory Specialist', 
                    dept: 'Supply Chain & Logistics', 
                    tag: 'Stock & Bin', 
                    tagColor: 'bg-amber-50 text-amber-700 border-amber-200' 
                  },
                  { 
                    role: 'Senior Sales Representative', 
                    dept: 'Commercial Enterprise Sales', 
                    tag: 'CRM & Orders', 
                    tagColor: 'bg-blue-50 text-blue-700 border-blue-200' 
                  },
                  { 
                    role: 'HR Director', 
                    dept: 'Human Resources & Payroll', 
                    tag: 'People Ops', 
                    tagColor: 'bg-rose-50 text-rose-700 border-rose-200' 
                  },
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickRole(item.role)}
                    className="w-full p-3 bg-white hover:bg-blue-50/60 hover:border-blue-300 border border-slate-200 rounded-xl text-left transition-all text-xs group flex items-center justify-between active:scale-[0.99] shadow-2xs cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {item.role}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.dept}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${item.tagColor}`}>
                        {item.tag}
                      </span>
                      <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Card Footer: Enterprise Security & Compliance Notice */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <p className="text-[11px] text-slate-400">
              Authorized access only. All activities are cryptographically audited.
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Need access? Contact <a href="mailto:admin@company.com" className="text-blue-600 hover:underline">SysAdmin Support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
