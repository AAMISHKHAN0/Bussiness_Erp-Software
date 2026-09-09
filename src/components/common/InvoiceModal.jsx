'use client';

import React from 'react';
import Modal from './Modal';
import { Printer, CheckCircle2, Clock } from 'lucide-react';

export default function InvoiceModal({ isOpen, onClose, order }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = order.payment_status === 'Paid';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Commercial Invoice #${order.order_number}`} maxWidth="max-w-3xl">
      <div className="space-y-6 text-slate-900 print:text-black">
        {/* Actions Bar */}
        <div className="flex justify-end gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Printer size={15} />
            Print / Export PDF
          </button>
        </div>

        {/* Printable Document Container */}
        <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs print:border-0 print:p-0 print:shadow-none">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black text-lg shadow-xs">
                  G
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900">Global Enterprise Solutions Inc.</h2>
                  <p className="text-xs text-slate-500 font-medium">Enterprise Compute, Networking & Infrastructure</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                450 Lexington Avenue, 28th Floor<br />
                New York, NY 10017<br />
                EIN: US-12-3456789 · contact@globalenterprise.com
              </p>
            </div>

            <div className="text-right">
              <span className="text-xl font-black text-blue-600 tracking-tight uppercase">COMMERCIAL INVOICE</span>
              <p className="text-sm font-bold text-slate-800 mt-1">#{order.order_number}</p>
              <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isPaid ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Clock size={13} className="text-amber-600" />}
                {order.payment_status || 'Pending'}
              </div>
            </div>
          </div>

          {/* Bill To & Invoice Info */}
          <div className="grid grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Billed To:</p>
              <p className="font-bold text-sm text-slate-900">{order.customer_name}</p>
              <p className="text-slate-600 mt-1">Corporate Client Account</p>
              <p className="text-slate-500 mt-0.5">Payment Terms: {order.payment_method || 'Net-30 Days'}</p>
            </div>
            <div className="text-right space-y-1">
              <p><span className="text-slate-400 font-semibold">Invoice Date:</span> <strong className="text-slate-800">{order.order_date || '2026-09-09'}</strong></p>
              <p><span className="text-slate-400 font-semibold">Payment Due:</span> <strong className="text-slate-800">{order.due_date || '2026-09-23'}</strong></p>
              <p><span className="text-slate-400 font-semibold">Authorized By:</span> <strong className="text-slate-800">{order.created_by || 'Global Enterprise'}</strong></p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50">
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-semibold text-slate-800">
                        {item.name}
                        {item.sku && <span className="block text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>}
                      </td>
                      <td className="p-3 text-center text-slate-600 font-medium">{item.quantity}</td>
                      <td className="p-3 text-right text-slate-600 font-mono">${parseFloat(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right font-bold text-slate-900 font-mono">${parseFloat(item.total || (item.quantity * item.unit_price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-slate-400">Standard Enterprise Contract Item</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary / Totals */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-start text-xs">
            <div className="max-w-xs text-slate-500 text-[11px] leading-relaxed">
              <p className="font-bold text-slate-700 mb-1">Settlement Details:</p>
              <p>Wire instructions: JPMorgan Chase Bank</p>
              <p>Routing: 021000021 · Account: 9812-4019-22</p>
              <p className="mt-1">Thank you for your partnership with Global Enterprise Solutions.</p>
            </div>
            <div className="w-56 space-y-1.5 text-right font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>${parseFloat(order.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount:</span>
                  <span>-${parseFloat(order.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Tax (8.5%):</span>
                <span>${parseFloat(order.tax_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
                <span>Total Due:</span>
                <span className="text-blue-600">${parseFloat(order.net_amount || order.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
