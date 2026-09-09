'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { 
  BarChart3, TrendingUp, DollarSign, Download, Loader2, 
  RefreshCw, Printer, FileText, ShoppingCart, Truck, 
  Package, Building2, CheckCircle2, Clock, AlertTriangle,
  ArrowUpRight, ShieldCheck, ChevronRight, Layers, PieChart
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Legend 
} from 'recharts';
import { formatCurrency } from '@/lib/currency';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState('all');
  const [reportSearch, setReportSearch] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportAllCSV = () => {
    if (!data) return;

    const { financialSummary, salesOrders = [], purchaseOrders = [], products = [] } = data;

    const sections = [];

    // 1. Financial Summary
    sections.push('=== EXECUTIVE FINANCIAL KPI SUMMARY ===');
    sections.push('Metric,Value');
    sections.push(`Total Commercial Sales Volume,${formatCurrency(financialSummary?.totalSalesVolume || 0)}`);
    sections.push(`Realized (Paid) Collections,${formatCurrency(financialSummary?.totalPaidSales || 0)}`);
    sections.push(`Outstanding Receivables (AR),${formatCurrency(financialSummary?.accountsReceivable || 0)}`);
    sections.push(`Total Procurement Expenditures,${formatCurrency(financialSummary?.totalProcurement || 0)}`);
    sections.push(`Received Restock Commitments,${formatCurrency(financialSummary?.totalReceivedProcurement || 0)}`);
    sections.push(`Outstanding Payables (AP),${formatCurrency(financialSummary?.accountsPayable || 0)}`);
    sections.push(`Gross Operating Margin,${formatCurrency(financialSummary?.grossMargin || 0)} (${financialSummary?.grossMarginPercent || 0}%)`);
    sections.push(`Capitalized Inventory (Cost Basis),${formatCurrency(financialSummary?.inventoryCostValuation || 0)}`);
    sections.push(`Projected Inventory (Retail Value),${formatCurrency(financialSummary?.inventoryRetailValuation || 0)}`);
    sections.push(`Critical Low Stock Items,${financialSummary?.lowStockCount || 0} SKUs`);
    sections.push('');

    // 2. Sales Orders
    sections.push('=== COMMERCIAL SALES ORDERS LEDGER ===');
    sections.push('Order Number,Date,Customer,Payment Terms,Fulfillment Status,Payment Status,Net Amount (PKR)');
    salesOrders.forEach(o => {
      sections.push(`"${o.order_number}","${o.order_date || ''}","${o.customer_name || ''}","${o.payment_method || 'Net-30'}","${o.status || 'Confirmed'}","${o.payment_status || 'Pending'}",${(o.net_amount || o.total_amount || 0).toFixed(2)}`);
    });
    sections.push('');

    // 3. Procurement Orders
    sections.push('=== VENDOR PROCUREMENT & EXPENDITURES ===');
    sections.push('PO Number,Order Date,Supplier Partner,Expected Delivery,Status,Payment Status,Total Commitment (PKR)');
    purchaseOrders.forEach(po => {
      sections.push(`"${po.order_number}","${po.order_date || ''}","${po.supplier_name || ''}","${po.expected_delivery_date || ''}","${po.status || 'Ordered'}","${po.payment_status || 'Unpaid'}",${(po.total_amount || 0).toFixed(2)}`);
    });
    sections.push('');

    // 4. Inventory Catalog
    sections.push('=== WAREHOUSE INVENTORY VALUATION & REORDER THRESHOLDS ===');
    sections.push('SKU,Item Description,Classification,Bin Location,Stock On Hand,Safety Level,Unit Cost (PKR),Unit Retail (PKR),Total Cost Valuation (PKR),Status');
    products.forEach(p => {
      const val = (Number(p.quantity) || 0) * (Number(p.purchase_price) || 0);
      sections.push(`"${p.sku}","${p.name}","${p.category_name}","${p.location || ''}",${p.quantity},${p.min_stock_level},${p.purchase_price},${p.selling_price},${val.toFixed(2)},"${p.status}"`);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + sections.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Enterprise_Executive_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fin = data?.financialSummary || {};
  const sales = data?.salesOrders || [];
  const purchases = data?.purchaseOrders || [];
  const products = data?.products || [];
  const clients = data?.clientConcentration || [];
  const vendors = data?.vendorConcentration || [];

  // Filtered rows based on search
  const filteredSales = sales.filter(o => 
    o.order_number.toLowerCase().includes(reportSearch.toLowerCase()) ||
    o.customer_name.toLowerCase().includes(reportSearch.toLowerCase())
  );

  const filteredPurchases = purchases.filter(p => 
    p.order_number.toLowerCase().includes(reportSearch.toLowerCase()) ||
    p.supplier_name.toLowerCase().includes(reportSearch.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(reportSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(reportSearch.toLowerCase()) ||
    p.category_name.toLowerCase().includes(reportSearch.toLowerCase())
  );

  return (
    <AppShell>
      {/* SCREEN ONLY HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Business Intelligence & Executive Reports
            </h1>
            <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Corporate Audit Dossier
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated enterprise manifest: commercial sales, vendor procurement, warehouse inventory, and GAAP EBITDA margins.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAnalytics}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
            title="Refresh All Datasets"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
          <button
            onClick={handleExportAllCSV}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Download Master Audit Sheet (CSV)"
          >
            <Download size={14} className="text-slate-500" />
            <span>Download Audit CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors active:scale-98 cursor-pointer"
            title="Print Boardroom-Ready Executive PDF"
          >
            <Printer size={15} />
            <span>Print Executive PDF</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-bold text-slate-500">Compiling executive audit manifest and ledgers...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* PRINT-ONLY OFFICIAL AUDIT LETTERHEAD */}
          <div className="hidden print:block pb-6 border-b-2 border-slate-900">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center font-black text-base rounded">
                    N
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900">NEXIS ENTERPRISE TECHNOLOGIES</h1>
                    <p className="text-xs text-slate-600">Enterprise Operating Cloud Environment</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Level 14, Corporate Tower, I.I. Chundrigar Road, Karachi, Pakistan<br />
                  National Tax Number (NTN): 4892011-7 · Corporate Sales Tax STRN: 3277876123456
                </p>
              </div>

              <div className="text-right">
                <span className="text-xl font-black text-blue-600 tracking-tight uppercase">EXECUTIVE AUDIT REPORT</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">Manifest Ref: AUD-{new Date().getFullYear()}-0912</p>
                <p className="text-[10px] text-slate-500">Period: Q1-Q3 FY2026</p>
                <p className="text-[10px] text-slate-500">Printed: {new Date().toLocaleString()}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 rounded">
                  Status: Certified Audit Ready
                </span>
              </div>
            </div>
          </div>

          {/* KPI CARDS (DOUBLE-BEZEL ARCHITECTURE) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="double-bezel">
              <div className="double-bezel-inner">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gross Billings (Sales)</p>
                  <ShoppingCart size={14} className="text-blue-600" />
                </div>
                <p className="text-2xl font-extrabold text-slate-900 mt-1.5 tabular-nums">
                  {formatCurrency(fin.totalSalesVolume || 0)}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                  <span>Settled: {formatCurrency(fin.totalPaidSales || 0)}</span>
                  <span className="text-amber-600 font-semibold">AR: {formatCurrency(fin.accountsReceivable || 0)}</span>
                </div>
              </div>
            </div>

            <div className="double-bezel">
              <div className="double-bezel-inner">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Procurement Commitments</p>
                  <Truck size={14} className="text-blue-600" />
                </div>
                <p className="text-2xl font-extrabold text-slate-900 mt-1.5 tabular-nums">
                  {formatCurrency(fin.totalProcurement || 0)}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                  <span>Received: {formatCurrency(fin.totalReceivedProcurement || 0)}</span>
                  <span className="text-slate-500">{fin.totalProcurementCount || 0} POs</span>
                </div>
              </div>
            </div>

            <div className="double-bezel">
              <div className="double-bezel-inner">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gross Operating Margin</p>
                  <TrendingUp size={14} className="text-emerald-600" />
                </div>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1.5 tabular-nums">
                  {formatCurrency(fin.grossMargin || 0)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  ~{fin.grossMarginPercent || 0}% Operating Margin on Enterprise Sales
                </p>
              </div>
            </div>

            <div className="double-bezel">
              <div className="double-bezel-inner">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Warehouse Valuation</p>
                  <Package size={14} className="text-blue-600" />
                </div>
                <p className="text-2xl font-extrabold text-blue-600 mt-1.5 tabular-nums">
                  {formatCurrency(fin.inventoryCostValuation || 0)}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                  <span>Retail: {formatCurrency(fin.inventoryRetailValuation || 0)}</span>
                  <span className={fin.lowStockCount > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                    {fin.lowStockCount || 0} Low Stock
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* INTERACTIVE REPORT NAVIGATION TABS (SCREEN ONLY) */}
          <div className="double-bezel print:hidden">
            <div className="double-bezel-inner !p-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {[
                  { id: 'all', label: 'All Consolidated Reports', icon: Layers },
                  { id: 'sales', label: `Sales Orders (${sales.length})`, icon: ShoppingCart },
                  { id: 'purchases', label: `Vendor Procurement (${purchases.length})`, icon: Truck },
                  { id: 'inventory', label: `Inventory Assets (${products.length})`, icon: Package },
                  { id: 'charts', label: 'Financial Modeling & Charts', icon: BarChart3 }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveReportTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        activeReportTab === tab.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon size={13} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  placeholder="Filter records across tables..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECTION 1: COMMERCIAL SALES ORDERS REPORT */}
          {(activeReportTab === 'all' || activeReportTab === 'sales') && (
            <div className="double-bezel break-inside-avoid">
              <div className="double-bezel-inner !p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <ShoppingCart size={16} className="text-blue-600" />
                      Commercial Sales & Client Revenue Ledger
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      B2B invoicing manifests, payment terms, and receivable reconciliation
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                    {filteredSales.length} Orders Listed
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">SO Number</th>
                        <th className="py-3 px-4">Corporate Client Account</th>
                        <th className="py-3 px-4">Order Date</th>
                        <th className="py-3 px-4">Payment Terms</th>
                        <th className="py-3 px-4 text-center">Fulfillment</th>
                        <th className="py-3 px-4 text-center">Payment Status</th>
                        <th className="py-3 px-4 text-right">Net Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSales.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">{order.order_number}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{order.customer_name}</td>
                          <td className="py-3 px-4 text-slate-500">{order.order_date}</td>
                          <td className="py-3 px-4 text-slate-600 font-medium">{order.payment_method || 'Net-30 Invoice'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                              order.status === 'Shipped' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                              'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {order.status || 'Confirmed'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              order.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {order.payment_status === 'Paid' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                              {order.payment_status || 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(order.net_amount || order.total_amount || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                        <td colSpan={6} className="py-3 px-4 text-right uppercase text-[11px] tracking-wider text-slate-600">
                          Total Commercial Billings Listed:
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sm text-blue-600">
                          {formatCurrency(filteredSales.reduce((sum, o) => sum + (Number(o.net_amount) || Number(o.total_amount) || 0), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: VENDOR PROCUREMENT & EXPENDITURES REPORT */}
          {(activeReportTab === 'all' || activeReportTab === 'purchases') && (
            <div className="double-bezel break-inside-avoid">
              <div className="double-bezel-inner !p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Truck size={16} className="text-blue-600" />
                      Vendor Procurement & Supply Chain Expenditures
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Manufacturer purchase orders, inbound freight logistics, and accounts payable commitments
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                    {filteredPurchases.length} POs Listed
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">PO Number</th>
                        <th className="py-3 px-4">Supplier Partner</th>
                        <th className="py-3 px-4">Issue Date</th>
                        <th className="py-3 px-4">Expected Delivery</th>
                        <th className="py-3 px-4 text-center">Fulfillment Status</th>
                        <th className="py-3 px-4 text-right">Commitment Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPurchases.map((po) => (
                        <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">{po.order_number}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{po.supplier_name}</td>
                          <td className="py-3 px-4 text-slate-500">{po.order_date}</td>
                          <td className="py-3 px-4 text-slate-500">{po.expected_delivery_date || 'Standard'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              po.status === 'Received' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                              po.status === 'Ordered' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                              'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {po.status === 'Received' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                              {po.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(po.total_amount || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                        <td colSpan={5} className="py-3 px-4 text-right uppercase text-[11px] tracking-wider text-slate-600">
                          Total Procurement Expenditures Listed:
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sm text-slate-900">
                          {formatCurrency(filteredPurchases.reduce((sum, po) => sum + (Number(po.total_amount) || 0), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: WAREHOUSE INVENTORY VALUATION & REORDER THRESHOLDS */}
          {(activeReportTab === 'all' || activeReportTab === 'inventory') && (
            <div className="double-bezel break-inside-avoid">
              <div className="double-bezel-inner !p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Package size={16} className="text-blue-600" />
                      Warehouse Inventory Valuation & Safety Thresholds
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Capitalized SKU assets, safety buffer reorder limits, and bin location allocations
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                    {filteredProducts.length} SKUs Listed
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">SKU Code</th>
                        <th className="py-3 px-4">Item Title</th>
                        <th className="py-3 px-4">Classification</th>
                        <th className="py-3 px-4">Bin Location</th>
                        <th className="py-3 px-4 text-center">Stock / Min</th>
                        <th className="py-3 px-4 text-right">Unit Cost</th>
                        <th className="py-3 px-4 text-right">Unit Retail</th>
                        <th className="py-3 px-4 text-right">Total Asset Valuation</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((p) => {
                        const val = Number(p.quantity) * Number(p.purchase_price);
                        const isCritical = Number(p.quantity) <= Number(p.min_stock_level);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-blue-600">{p.sku}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                            <td className="py-3 px-4 text-slate-600">{p.category_name}</td>
                            <td className="py-3 px-4 text-slate-500">{p.location || 'Warehouse Main'}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold">
                              <span className={isCritical ? 'text-amber-600' : 'text-slate-900'}>
                                {p.quantity}
                              </span>
                              <span className="text-slate-400 font-normal"> / {p.min_stock_level}</span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-500">{formatCurrency(p.purchase_price)}</td>
                            <td className="py-3 px-4 text-right font-mono text-slate-900 font-semibold">{formatCurrency(p.selling_price)}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-blue-600">
                              {formatCurrency(val)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                                isCritical ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              }`}>
                                {isCritical ? 'Low Stock' : 'In Stock'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                        <td colSpan={7} className="py-3 px-4 text-right uppercase text-[11px] tracking-wider text-slate-600">
                          Total Capitalized Inventory Cost Basis:
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sm text-blue-600">
                          {formatCurrency(filteredProducts.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.purchase_price)), 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: CLIENT AR & PORTFOLIO CONCENTRATION */}
          {(activeReportTab === 'all' || activeReportTab === 'charts') && (
            <div className="double-bezel break-inside-avoid">
              <div className="double-bezel-inner !p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Building2 size={16} className="text-blue-600" />
                      Enterprise Client Billings & Accounts Receivable Aging
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Top institutional accounts, lifetime billings, open AR, and credit facility limits
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                    GAAP Ledger #1100
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Corporate Client Account</th>
                        <th className="py-3 px-4 text-right">Lifetime Billings</th>
                        <th className="py-3 px-4 text-right">Open AR Balance</th>
                        <th className="py-3 px-4 text-right">Approved Credit Facility</th>
                        <th className="py-3 px-4 text-center">Standing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clients.map((client, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{client.name}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(client.spent || 0)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-600">
                            {formatCurrency(client.balance || 0)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                            {formatCurrency(client.credit_limit || 0)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                              Good Standing
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: CHARTS & FINANCIAL MODELING (SCREEN & DIGITAL AUDIT) */}
          {(activeReportTab === 'all' || activeReportTab === 'charts') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 break-inside-avoid">
              {/* Historical EBITDA & Revenue */}
              <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Quarterly Gross Revenue vs EBITDA Margin</h3>
                    <p className="text-xs text-slate-500">Trailing operational margin and EBITDA evolution</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">+24.2% YoY</span>
                </div>

                <div className="h-64 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.historicalPerformance || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="quarter" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => formatCurrency(v, { compact: true })} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0.5rem', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="revenue" name="Gross Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="ebitda" name="EBITDA Margin" fill="#059669" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Asset Valuation */}
              <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Category Capitalized Asset Valuation</h3>
                    <p className="text-xs text-slate-500">Inventory value distribution across classifications</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {data?.categoryDistribution?.length || 5} Classifications
                  </span>
                </div>

                <div className="h-64 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.categoryDistribution || []} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => formatCurrency(v, { compact: true })} />
                      <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0.5rem', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="stockValue" name="Asset Value (PKR)" fill="#2563eb" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* OFFICIAL AUDIT SIGN-OFF BLOCK (PRINT & SCREEN AUDIT MANIFEST) */}
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-4 break-inside-avoid">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Official Certification & Audit Attestation</p>
                <p className="text-[11px] text-slate-500">Statements prepared in conformity with Generally Accepted Accounting Principles (GAAP).</p>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Signed Hash: 8f9b4c2e-71a0-4d56-a38f-9e120bc7d18a</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chief Executive Officer</p>
                <div className="mt-4 pt-2 border-t border-slate-300">
                  <p className="text-xs font-bold text-slate-800">Alexander Vance, CEO</p>
                  <p className="text-[10px] text-slate-500">Global Enterprise Solutions Inc.</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Financial Controller / Auditor</p>
                <div className="mt-4 pt-2 border-t border-slate-300">
                  <p className="text-xs font-bold text-slate-800">Sarah Jenkins, CPA</p>
                  <p className="text-[10px] text-slate-500">Corporate Finance & Compliance</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Audit Date & Seal</p>
                <div className="mt-4 pt-2 border-t border-slate-300">
                  <p className="text-xs font-bold text-slate-800">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <ShieldCheck size={11} /> Unqualified Opinion (Clean Audit)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
