'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { 
  Banknote, ShoppingCart, Package, Users, TrendingUp, 
  TrendingDown, AlertTriangle, ArrowUpRight, Plus, 
  Clock, ShieldCheck, Loader2, RefreshCw, ArrowRight,
  Activity, Landmark, Wallet, Receipt, DollarSign,
  FileText, ArrowDownLeft, ChevronRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { formatCurrency } from '@/lib/currency';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState('');
  const [range, setRange] = useState('30d'); // 'today' | '7d' | '30d' | '3m' | '6m' | '1y'

  const fetchDashboard = async (selectedRange = range) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?range=${selectedRange}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(range);
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRangeChange = (newRange) => {
    setRange(newRange);
    fetchDashboard(newRange);
  };

  const getStatIcon = (id) => {
    switch (id) {
      case 'today_sales': return <Banknote className="w-4 h-4 text-emerald-600" />;
      case 'monthly_sales': return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'ar': return <ArrowUpRight className="w-4 h-4 text-indigo-600" />;
      case 'expenses': return <ArrowDownLeft className="w-4 h-4 text-rose-600" />;
      case 'cash_bank': return <Landmark className="w-4 h-4 text-sky-600" />;
      case 'inventory_val': return <Package className="w-4 h-4 text-amber-600" />;
      case 'low_stock': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default: return <Banknote className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <AppShell>
      {/* Executive Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
              Live Command Center
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real Data Sync Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Business Analytics & Operations
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Unified retail POS throughput, commercial invoicing, inventory valuation, and GAAP treasury liquidity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 shadow-2xs">
            <Clock size={14} className="text-blue-600" />
            <span>{time || 'Syncing...'}</span>
          </div>

          <button
            onClick={() => fetchDashboard(range)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>

          <Link
            href="/pos"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-colors"
          >
            <ShoppingCart size={14} />
            <span>Launch POS</span>
          </Link>

          <Link
            href="/invoices"
            className="btn-pod-blue group"
          >
            <span>Create Invoice</span>
            <span className="pod-icon">
              <Plus size={13} className="text-white" />
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
          {/* 7 Client-Required Core Financial KPI Cards with Drill-Down Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data?.stats?.map((card, i) => {
              const CardWrapper = card.href ? Link : 'div';
              return (
                <CardWrapper
                  key={card.id || i}
                  href={card.href || '#'}
                  className="double-bezel group block transition-all"
                >
                  <div className="double-bezel-inner !p-4 flex flex-col justify-between h-36">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate pr-1">
                        {card.title}
                      </p>
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors flex-shrink-0">
                        {getStatIcon(card.id)}
                      </div>
                    </div>

                    <div className="my-auto">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono truncate">
                        {card.isCurrency 
                          ? formatCurrency(card.value)
                          : Number(card.value).toLocaleString()
                        }
                      </h3>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className={`flex items-center gap-1 font-bold text-[10px] ${
                        card.trend === 'down' && card.id === 'low_stock' ? 'text-amber-600' :
                        card.trend === 'down' ? 'text-slate-600' : 'text-emerald-600'
                      }`}>
                        {card.change}
                      </span>
                      <span className="text-blue-600 text-[10px] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Drill-down <ChevronRight size={11} />
                      </span>
                    </div>
                  </div>
                </CardWrapper>
              );
            })}
          </div>

          {/* Sales Chart with Range Selector & Low Stock Bento Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Velocity Chart with Range Buttons */}
            <div className="lg:col-span-2 double-bezel">
              <div className="double-bezel-inner !p-5 flex flex-col h-full space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Sales Overview & Velocity</h3>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        Real Transactions
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Combined POS checkout + Commercial Invoicing (PKR)</p>
                  </div>

                  {/* Dynamic Time Range Filter Buttons */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    {[
                      { id: 'today', label: 'Today' },
                      { id: '7d', label: '7D' },
                      { id: '30d', label: '30D' },
                      { id: '3m', label: '3M' },
                      { id: '6m', label: '6M' },
                      { id: '1y', label: '1Y' },
                    ].map(btn => (
                      <button
                        key={btn.id}
                        onClick={() => handleRangeChange(btn.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                          range === btn.id
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.salesChartData || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={11} 
                        tickLine={false} 
                        tickFormatter={(v) => formatCurrency(v, { compact: true })} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        formatter={(v) => [formatCurrency(v), '']}
                      />
                      <Area type="monotone" dataKey="sales" name="Sales Revenue" stroke="#2563eb" strokeWidth={2.5} fillOpacity={0.08} fill="#2563eb" />
                      <Area type="monotone" dataKey="expenses" name="Operational Expenses" stroke="#64748b" strokeWidth={2} fillOpacity={0.04} fill="#64748b" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Critical Stock Alert Sidebar Card */}
            <div className="double-bezel">
              <div className="double-bezel-inner !p-5 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Stock Reorder Alerts</h3>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                      {data?.actionItems?.criticalStock?.length || 0} Low
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
                    {data?.actionItems?.criticalStock && data.actionItems.criticalStock.length > 0 ? (
                      data.actionItems.criticalStock.map((prod) => (
                        <div key={prod.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between hover:bg-slate-100/70 transition-colors">
                          <div className="pr-2 overflow-hidden">
                            <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                            <p className="text-[10px] font-mono text-slate-500">SKU: {prod.sku}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-black text-rose-600 font-mono">{prod.quantity} Left</p>
                            <p className="text-[10px] text-slate-400 font-medium">Threshold: {prod.min_stock_level}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-slate-500 text-xs">
                        <ShieldCheck size={28} className="mx-auto text-emerald-600 mb-2" />
                        All warehouse inventory allocations nominal.
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href="/inventory"
                  className="w-full py-2.5 rounded-lg bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-center font-bold text-xs text-blue-700 transition-colors block"
                >
                  Manage Stock Allocations →
                </Link>
              </div>
            </div>
          </div>

          {/* Unified Recent Transactions Stream with Drill-Down Links */}
          <div className="double-bezel">
            <div className="double-bezel-inner !p-0 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Recent Enterprise Transactions</h3>
                  <p className="text-xs text-slate-500">Consolidated real business events: POS Sales, Invoices, Payments, and Corporate Expenses</p>
                </div>
                <Link
                  href="/accounting"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  <span>View All in General Ledger</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Reference #</th>
                      <th className="py-3 px-4">Counterparty / Customer</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Amount (PKR)</th>
                      <th className="py-3 px-4 text-right">Drill-down</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.recentTransactions?.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            tx.category === 'Sale' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            tx.category === 'Invoice' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            tx.category === 'Payment' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                            tx.category === 'Expense' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">{tx.reference}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{tx.customer_party}</td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{tx.date}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {tx.status}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold text-sm tabular-nums ${
                          tx.category === 'Expense' ? 'text-rose-600' : 'text-slate-900'
                        }`}>
                          {tx.category === 'Expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={tx.drilldownHref || '/accounting'}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center justify-end gap-1"
                          >
                            <span>Inspect</span>
                            <ChevronRight size={12} />
                          </Link>
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
