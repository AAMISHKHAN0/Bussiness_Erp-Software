'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { 
  Settings, Building2, Globe, Cpu, Database, 
  RotateCcw, Save, ShieldCheck, CheckCircle2, Loader2, RefreshCw 
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    company_name: '',
    legal_name: '',
    tax_id: '',
    company_email: '',
    company_phone: '',
    address: '',
    currency: 'USD',
    currency_symbol: '$',
    default_tax_rate: 8.5
  });
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin');
      const json = await res.json();
      if (json.success) {
        setSettings(json.data.settings || {});
        setHealth(json.data.systemHealth || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm('Warning: This will reload the clean standardized corporate dataset. Proceed?')) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-data' })
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-600" />
              System & Enterprise Settings
            </h1>
            <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Administrative Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global business profile, currency parameters, statutory tax rates, and database state management.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAdminData}
            className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-bold text-slate-500">Loading system parameters...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings Form (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSave} className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Corporate Legal Profile</h3>
                </div>
                {savedSuccess && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 font-bold animate-in fade-in">
                    <CheckCircle2 size={13} /> Settings Persisted
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Company Trade Name</label>
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Official Legal Entity Name</label>
                  <input
                    type="text"
                    value={settings.legal_name}
                    onChange={(e) => setSettings({ ...settings, legal_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Federal Tax ID / EIN</label>
                  <input
                    type="text"
                    value={settings.tax_id}
                    onChange={(e) => setSettings({ ...settings, tax_id: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Corporate Communications Email</label>
                  <input
                    type="email"
                    value={settings.company_email}
                    onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Headquarters Phone</label>
                  <input
                    type="text"
                    value={settings.company_phone}
                    onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Default Sales Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.default_tax_rate}
                    onChange={(e) => setSettings({ ...settings, default_tax_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Headquarters Address</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Operating Currency Code</label>
                  <input
                    type="text"
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={settings.currency_symbol}
                    onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-mono text-center"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-2 transition-colors active:scale-95"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar Info & Danger Zone */}
          <div className="space-y-6">
            {/* System Health */}
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                <Cpu className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Runtime Architecture</h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Platform Deployment</span>
                  <span className="font-mono font-bold text-slate-900">Vercel Ready (Next.js 15)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Fullstack Topology</span>
                  <span className="font-mono font-bold text-slate-900">Unified App Router</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Database Engine</span>
                  <span className="font-mono font-bold text-blue-600">Enterprise JSON File / Vercel Postgres</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Memory Allocation</span>
                  <span className="font-mono font-bold text-slate-900">{health?.memoryUsageMB || 48} MB</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">API Health Status</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 size={11} /> Nominal
                  </span>
                </div>
              </div>
            </div>

            {/* Database Benchmark State Reset */}
            <div className="p-6 rounded-xl bg-white border border-red-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <RotateCcw size={18} />
                <span>Reset Database Benchmark</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Restore the database back to standard GAAP Chart of Accounts, realistic commercial hardware products, and corporate test accounts.
              </p>
              <button
                onClick={handleResetData}
                className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-xs transition-colors active:scale-95 flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={13} />
                <span>Reset to Standard Enterprise Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
