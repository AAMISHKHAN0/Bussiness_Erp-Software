'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { 
  DollarSign, ShoppingCart, Package, Users, TrendingUp, 
  TrendingDown, AlertTriangle, ArrowUpRight, Plus, 
  Clock, ShieldCheck, Loader2, RefreshCw
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

  const getStatIcon = (title) => {
    switch (title) {
      case 'Total Revenue': return <DollarSign className="w-5 h-5 text-blue-600" />;
      case 'Operating Treasury': return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      case 'Stock Units': return <Package className="w-5 h-5 text-blue-600" />;
      default: return <Users className="w-5 h-5 text-slate-700" />;
    }
  };

  return (
    <AppShell>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Executive Dashboard
            </h1>
            <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Operational Overview
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time business performance, cash liquidity, and warehouse stock levels.
          </p>
        </div>

        {/* Live Clock & Quick Action */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-700 shadow-2xs">
            <Clock size={14} className="text-blue-600" />
            <span>{time || 'Synchronizing...'}</span>
          </div>

          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="p-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>

          <Link
            href="/sales"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors active:scale-95"
          >
            <Plus size={16} />
            <span>New Sales Order</span>
          </Link>
        </div>
      </div>

      {loading && !data ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-bold text-slate-500">Loading enterprise metrics...</p>
        </div>
      ) : (
        <>
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data?.stats?.map((card, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{card.title}</p>
                  <div className="p-2 rounded-lg bg-slate-100">
                    {getStatIcon(card.title)}
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {card.isCurrency && '$'}
                    {Number(card.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </h3>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <TrendingUp size={13} />
                    {card.change}
                  </span>
                  <span className="text-slate-400 text-[11px] font-medium">{card.subtitle}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts & Visual Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend Area Chart */}
            <div className="lg:col-span-2 p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Financial Performance Curve</h3>
                  <p className="text-xs text-slate-500">Monthly Revenue vs Operational Expenses (USD)</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Revenue
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Expenses
                  </span>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.monthlyTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0.5rem', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      formatter={(v) => [`$${v.toLocaleString()}`, '']}
                    />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Critical Stock Card */}
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base font-bold text-slate-900">Stock Reorder Alerts</h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    {data?.criticalStock?.length || 0} Items
                  </span>
                </div>

                <div className="mt-4 space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {data?.criticalStock && data.criticalStock.length > 0 ? (
                    data.criticalStock.map((prod) => (
                      <div key={prod.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{prod.name}</p>
                          <p className="text-[10px] font-mono text-slate-500">SKU: {prod.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-extrabold text-red-600">{prod.quantity} Left</p>
                          <p className="text-[10px] text-slate-400">Min: {prod.min_stock_level}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      <ShieldCheck size={28} className="mx-auto text-emerald-600 mb-2" />
                      All inventory stock levels are nominal.
                    </div>
                  )}
                </div>
              </div>

              <Link
                href="/inventory"
                className="w-full mt-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-center font-bold text-xs text-blue-700 transition-colors block"
              >
                Open Inventory Management →
              </Link>
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Sales Orders</h3>
                <p className="text-xs text-slate-500">Commercial orders and fulfillment status</p>
              </div>
              <Link href="/sales" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <span>View All Orders</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Order Number</th>
                    <th className="py-3 px-3">Client Account</th>
                    <th className="py-3 px-3">Order Date</th>
                    <th className="py-3 px-3 text-right">Net Value</th>
                    <th className="py-3 px-3 text-center">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.recentOrders?.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-blue-600">{order.order_number}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{order.customer_name}</td>
                      <td className="py-3 px-3 text-slate-500">{order.date}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ${parseFloat(order.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
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
        </>
      )}
    </AppShell>
  );
}
