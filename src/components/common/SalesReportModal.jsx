'use client';

import React from 'react';
import Modal from './Modal';
import { Printer, Download, DollarSign, CheckCircle2, Clock, Building, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import NexisLogo from './NexisLogo';

export default function SalesReportModal({ isOpen, onClose, orders = [], customers = [] }) {
  if (!isOpen) return null;

  const totalSalesVolume = orders.reduce((sum, o) => sum + (Number(o.net_amount) || 0), 0);
  const totalPaid = orders.filter(o => o.payment_status === 'Paid').reduce((sum, o) => sum + (Number(o.net_amount) || 0), 0);
  const totalReceivables = totalSalesVolume - totalPaid;
  const avgOrderValue = orders.length > 0 ? Math.round(totalSalesVolume / orders.length) : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer', 'Payment Terms', 'Payment Status', 'Fulfillment Status', 'Net Amount (PKR)'];
    const rows = orders.map(o => [
      o.order_number,
      o.order_date || '',
      `"${o.customer_name || ''}"`,
      `"${o.payment_method || 'Net-30'}"`,
      o.payment_status || 'Pending',
      o.status || 'Confirmed',
      parseFloat(o.net_amount || 0).toFixed(0)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NEXIS_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Executive Sales Performance & Audit Report" 
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6 text-slate-900 print:text-black">
        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-3 print:hidden bg-slate-50 p-3 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-600 font-medium">
            Fiscal Year 2026 Audit Manifest &middot; Generated on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Download size={14} className="text-slate-500" />
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer size={14} />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Printable Report Document */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs print:border-0 print:p-0 print:shadow-none space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2.5">
                <NexisLogo size="md" />
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Level 14, Executive Tower, Clifton Block 4, Karachi, Pakistan<br />
                NTN: 4892011-7 &middot; GAAP Compliant Sales Ledger (PKR)
              </p>
            </div>

            <div className="text-right">
              <span className="text-xl font-black text-blue-600 tracking-tight uppercase">SALES REPORT</span>
              <p className="text-xs font-bold text-slate-700 mt-1 font-mono">Ref: SR-{new Date().getFullYear()}-{orders.length}</p>
              <p className="text-[11px] text-slate-500">Period: Q1-Q3 FY2026</p>
              <p className="text-[11px] text-slate-500">Printed: {new Date().toLocaleString()}</p>
            </div>
          </div>

          {/* Executive Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Gross Sales Volume</p>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                {formatCurrency(totalSalesVolume)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{orders.length} transactions</p>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Realized (Paid)</p>
              <p className="text-lg font-extrabold text-emerald-600 mt-0.5">
                {formatCurrency(totalPaid)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Cleared funds</p>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Receivables (AR)</p>
              <p className="text-lg font-extrabold text-amber-600 mt-0.5">
                {formatCurrency(totalReceivables)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">GAAP #1100</p>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg Ticket Size</p>
              <p className="text-lg font-extrabold text-blue-600 mt-0.5">
                {formatCurrency(avgOrderValue)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Commercial B2B</p>
            </div>
          </div>

          {/* Detailed Orders Manifest Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Commercial Orders Manifest</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider bg-slate-100/80">
                    <th className="p-2.5">SO Number</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Corporate Client</th>
                    <th className="p-2.5">Terms</th>
                    <th className="p-2.5 text-center">Fulfillment</th>
                    <th className="p-2.5 text-center">Payment</th>
                    <th className="p-2.5 text-right">Net Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-bold font-mono text-slate-900">{o.order_number}</td>
                      <td className="p-2.5 text-slate-600 font-mono text-[11px]">{o.order_date || '2026-09-09'}</td>
                      <td className="p-2.5 font-semibold text-slate-800">{o.customer_name}</td>
                      <td className="p-2.5 text-slate-500 text-[11px]">{o.payment_method || 'Net 30'}</td>
                      <td className="p-2.5 text-center">
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                          {o.status || 'Confirmed'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          o.payment_status === 'Paid' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {o.payment_status || 'Pending'}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(o.net_amount || o.total_amount || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
                    <td colSpan="6" className="p-2.5 text-right uppercase text-[11px] tracking-wider">
                      Total Certified Net Sales:
                    </td>
                    <td className="p-2.5 text-right font-mono text-blue-600 text-sm">
                      {formatCurrency(totalSalesVolume)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Audit Certification Footer */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-2">Comptroller Authorization</p>
              <div className="border-b border-slate-300 pb-4 mb-1">
                <span className="font-mono text-slate-800 text-[11px]">Victoria Chen, CPA &mdash; Financial Controller</span>
              </div>
              <p className="text-[10px]">Digitally certified under GAAP Financial Accounting Standards #1010-6040</p>
            </div>
            <div>
              <p className="font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-2">Commercial Sales Director</p>
              <div className="border-b border-slate-300 pb-4 mb-1">
                <span className="font-mono text-slate-800 text-[11px]">Derrick Cole &mdash; VP Commercial Accounts</span>
              </div>
              <p className="text-[10px]">Confidential &mdash; Internal & Client Audit Purposes Only</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
