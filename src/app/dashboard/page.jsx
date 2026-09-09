'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { 
  DollarSign, ShoppingCart, Package, Users, TrendingUp, 
  TrendingDown, AlertTriangle, ArrowUpRight, Plus, 
  Clock, ShieldCheck, Loader2, RefreshCw, ArrowRight,
  Activity, Sparkles
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatIcon = (id, title) => {
    switch (id) {
      case 'revenue': return <DollarSign className="w-4 h-4 text-blue-600" />;
      case 'gross_profit': return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'treasury': return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      case 'inventory_val': return <Package className="w-4 h-4 text-amber-600" />;
      case 'ar': return <ArrowUpRight className="w-4 h-4 text-violet-600" />;
      case 'ap': return <TrendingDown className="w-4 h-4 text-rose-600" />;
      default: {
        if (title?.includes('Revenue')) return <DollarSign className="w-4 h-4 text-blue-600" />;
        if (title?.includes('Treasury')) return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
        if (title?.includes('Stock')) return <Package className="w-4 h-4 text-amber-600" />;
        return <Users className="w-4 h-4 text-slate-700" />;
      }
    }
  };

  return (
    <AppShell>
      {/* =========================================================================
          EXECUTIVE COMMAND HEADER
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
              Live Command Center
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              99.99% Cloud SLA
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Operational Overview
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Real-time multi-warehouse inventory throughput, GAAP general ledger liquidity, and active commercial orders.
          </p>
        </div>

        {/* Live Synchronizer & Nested Button-in-Button CTA */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-mono text-slate-700 shadow-2xs">
            <Clock size={14} className="text-blue-600" />
            <span>{time || 'Syncing...'}</span>
          </div>

          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-600 hover:text-slate-900 transition-all duration-300 shadow-2xs active:scale-95 cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>

          {/* Nested Button-in-Button CTA */}
          <Link
            href="/sales"
            className="group px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2.5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
          >
            <span>New Sales Order</span>
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-300">
              <Plus size={12} className="text-white" />
            </span>
          </Link>
        </div>
      </div>

      {loading && !data ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-bold text-slate-500">Calculating real-time enterprise metrics...</p>
        </div>
      ) : (
        <>
          {/* =========================================================================
              DOUBLE-BEZEL KPI BENTO TILES (6-Metric Ledger)
              ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {data?.stats?.map((card, i) => (
              <div
                key={card.id || i}
                className="p-1 rounded-[1.25rem] bg-slate-200/60 border border-slate-200/80 shadow-2xs hover:bg-slate-200/90 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group"
              >
                {/* Inner Precision Core */}
                <div className="p-3.5 sm:p-4 rounded-[1rem] bg-white border border-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col justify-between h-full space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate pr-1">{card.title}</p>
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors flex-shrink-0">
                      {getStatIcon(card.id, card.title)}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono truncate">
                      {card.isCurrency && '$'}
                      {Number(card.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span className={`flex items-center gap-1 font-bold text-[10px] ${
                      card.trend === 'down' ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {card.trend === 'down' ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                      {card.change}
                    </span>
                    <span className="text-slate-400 text-[10px] font-medium truncate ml-1">{card.subtitle}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Executive Action Banner (Pending PO Approvals & Overdue Collections) */}
          {(data?.actionItems?.pendingApprovals?.length > 0 || data?.actionItems?.overdueInvoices?.length > 0) && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    Executive Authorization & Action Required
                  </h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {data.actionItems.pendingApprovals?.length > 0 && `${data.actionItems.pendingApprovals.length} purchase order(s) awaiting executive sign-off. `}
                    {data.actionItems.overdueInvoices?.length > 0 && `${data.actionItems.overdueInvoices.length} customer invoice(s) past due terms.`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {data.actionItems.pendingApprovals?.length > 0 && (
                  <Link
                    href="/purchases"
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold transition-colors shadow-2xs"
                  >
                    Review POs ({data.actionItems.pendingApprovals.length})
                  </Link>
                )}
                {data.actionItems.overdueInvoices?.length > 0 && (
                  <Link
                    href="/accounting"
                    className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-colors shadow-2xs"
                  >
                    Audit Ledger
                  </Link>
                )}
              </div>
            </div>
          )}


          {/* =========================================================================
              ANALYTICS & OPERATIONAL SPLIT SECTION (Double-Bezel Architecture)
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend Area Chart */}
            <div className="lg:col-span-2 p-1 rounded-[1.25rem] bg-slate-200/60 border border-slate-200/80 shadow-2xs">
              <div className="p-6 rounded-[1rem] bg-white border border-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col h-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Financial Velocity Curve</h3>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        GAAP #4010 vs #5010
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Commercial Revenue vs Cost of Goods Sold (USD)</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Revenue
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Expenses
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.monthlyTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        formatter={(v) => [`$${v.toLocaleString()}`, '']}
                      />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={2.5} fillOpacity={0.08} fill="#2563eb" />
                      <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#64748b" strokeWidth={2} fillOpacity={0.05} fill="#64748b" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Critical Stock Reorder Bento Card */}
            <div className="p-1 rounded-[1.25rem] bg-slate-200/60 border border-slate-200/80 shadow-2xs">
              <div className="p-6 rounded-[1rem] bg-white border border-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Stock Reorder Alerts</h3>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {data?.criticalStock?.length || 0} Critical
                    </span>
                  </div>

                  <div className="mt-4 space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {data?.criticalStock && data.criticalStock.length > 0 ? (
                      data.criticalStock.map((prod) => (
                        <div key={prod.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between hover:bg-slate-100/70 transition-colors">
                          <div className="pr-2 overflow-hidden">
                            <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                            <p className="text-[10px] font-mono text-slate-500">SKU: {prod.sku}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-black text-red-600 font-mono">{prod.quantity} Left</p>
                            <p className="text-[10px] text-slate-400 font-medium">Threshold: {prod.min_stock_level}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-slate-500 text-xs">
                        <ShieldCheck size={28} className="mx-auto text-emerald-600 mb-2" />
                        All inventory allocations are nominal.
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href="/inventory"
                  className="w-full mt-4 py-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 text-center font-bold text-xs text-blue-700 transition-all duration-300 block active:scale-[0.99]"
                >
                  Manage Warehouse Allocations →
                </Link>
              </div>
            </div>
          </div>

          {/* =========================================================================
              RECENT SALES ORDERS TABLE (Double-Bezel)
              ========================================================================= */}
          <div className="p-1 rounded-[1.25rem] bg-slate-200/60 border border-slate-200/80 shadow-2xs">
            <div className="p-6 rounded-[1rem] bg-white border border-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Recent Commercial Orders</h3>
                  <p className="text-xs text-slate-500">B2B client fulfillment manifests and settlement status</p>
                </div>
                <Link 
                  href="/sales" 
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group transition-colors"
                >
                  <span>View Full Manifest</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3.5">SO Number</th>
                      <th className="py-3 px-3.5">Corporate Client</th>
                      <th className="py-3 px-3.5">Order Date</th>
                      <th className="py-3 px-3.5 text-right">Net Value</th>
                      <th className="py-3 px-3.5 text-center">Fulfillment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.recentOrders?.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-blue-600">{order.order_number}</td>
                        <td className="py-3 px-3.5 font-semibold text-slate-800">{order.customer_name}</td>
                        <td className="py-3 px-3.5 text-slate-500 font-mono text-[11px]">{order.date}</td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                          ${parseFloat(order.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            order.status === 'Confirmed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
