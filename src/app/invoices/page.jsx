'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Modal from '@/components/common/Modal';
import { useToast } from '@/context/ToastContext';
import { 
  FileText, Plus, Search, Filter, Printer, Download, 
  DollarSign, CheckCircle2, Clock, AlertTriangle, XCircle, 
  Trash2, RefreshCw, ChevronRight, Eye, CreditCard, 
  Building2, Calendar, User, ArrowUpRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { printInvoice } from '@/lib/printEngine';

export default function InvoicesPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // New Invoice Form
  const [invoiceForm, setInvoiceForm] = useState({
    customer_id: '',
    invoice_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    discount_amount: 0,
    tax_amount: 0,
    status: 'Issued',
    notes: 'Thank you for your partnership. Please settle within due date.',
    terms: 'Net-30. Late payments subject to standard 1.5% statutory finance charge.',
    items: [
      { name: 'Enterprise Software Subscription', quantity: 1, unit_price: 150000 }
    ]
  });

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_method: 'Bank Transfer',
    payment_date: new Date().toISOString().slice(0, 10),
    reference: ''
  });

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invoices');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error(json.message || 'Failed to load invoices');
      }
    } catch (err) {
      toast.error('Network error loading invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const invoices = data?.invoices || [];
  const customers = data?.customers || [];
  const products = data?.products || [];
  const summary = data?.summary || { totalInvoiced: 0, totalOutstanding: 0, overdueCount: 0, paidCount: 0 };

  // Filtered Invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery = !searchQuery || 
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.customer_name.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  // Dynamic Line Item Handlers
  const addLineItem = () => {
    setInvoiceForm(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, unit_price: 0 }]
    }));
  };

  const removeLineItem = (idx) => {
    if (invoiceForm.items.length <= 1) return;
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const updateLineItem = (idx, field, val) => {
    const updated = [...invoiceForm.items];
    updated[idx][field] = val;
    setInvoiceForm(prev => ({ ...prev, items: updated }));
  };

  // Form Subtotal Calculation
  const formSubtotal = invoiceForm.items.reduce((s, i) => s + ((Number(i.quantity) || 1) * (Number(i.unit_price) || 0)), 0);
  const formTax = Math.round(Math.max(0, formSubtotal - Number(invoiceForm.discount_amount)) * 0.18 * 100) / 100;
  const formTotal = Math.round((Math.max(0, formSubtotal - Number(invoiceForm.discount_amount)) + formTax) * 100) / 100;

  // Create Invoice Submit
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceForm.customer_id) {
      toast.error('Please select a customer for this invoice');
      return;
    }

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...invoiceForm,
          tax_amount: formTax
        })
      });

      const json = await res.json();
      if (json.success) {
        setIsCreateModalOpen(false);
        fetchInvoices();
        toast.success(`Commercial Invoice ${json.data?.invoice_number || ''} created successfully!`);
        setInvoiceForm({
          customer_id: '',
          invoice_date: new Date().toISOString().slice(0, 10),
          due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          discount_amount: 0,
          tax_amount: 0,
          status: 'Issued',
          notes: 'Thank you for your partnership. Please settle within due date.',
          terms: 'Net-30. Late payments subject to standard 1.5% statutory finance charge.',
          items: [{ name: 'Enterprise Software Subscription', quantity: 1, unit_price: 150000 }]
        });
      } else {
        toast.error(json.message || 'Failed to create invoice');
      }
    } catch (err) {
      toast.error(err.message || 'Error saving invoice');
    }
  };

  // Record Payment Submit
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record-payment',
          invoice_id: selectedInvoice.id,
          ...paymentForm
        })
      });

      const json = await res.json();
      if (json.success) {
        setIsPaymentModalOpen(false);
        fetchInvoices();
        toast.success(json.message || 'Payment successfully recorded and posted to GAAP ledger!');
      } else {
        toast.error(json.message || 'Failed to record payment');
      }
    } catch (err) {
      toast.error(err.message || 'Error processing payment');
    }
  };

  // Issue Draft Invoice
  const handleIssueInvoice = async (invoice) => {
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'issue', invoice_id: invoice.id })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        fetchInvoices();
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error('Error issuing invoice');
    }
  };

  // Void Invoice
  const handleVoidInvoice = async (invoice) => {
    const reason = prompt(`Reason for voiding ${invoice.invoice_number}:`, 'Duplicate or Cancelled Order');
    if (!reason) return;

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'void', invoice_id: invoice.id, reason })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        fetchInvoices();
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error('Error voiding invoice');
    }
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Commercial Invoice Management
            </h1>
            <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Billing & Receivables
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate compliant commercial invoices, track collections, record partial/full settlements, and print PDF vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchInvoices}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors shadow-2xs"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
          
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-pod-blue group"
          >
            <span>Create Commercial Invoice</span>
            <span className="pod-icon">
              <Plus size={13} className="text-white" />
            </span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="double-bezel">
          <div className="double-bezel-inner !p-4">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Invoiced Volume</span>
            <p className="text-xl font-extrabold text-slate-900 mt-2 font-mono tabular-nums">
              {formatCurrency(summary.totalInvoiced)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">{summary.totalCount} total billing records</p>
          </div>
        </div>

        <div className="double-bezel">
          <div className="double-bezel-inner !p-4">
            <span className="text-xs font-bold text-slate-500 uppercase">Outstanding Receivables</span>
            <p className="text-xl font-extrabold text-blue-600 mt-2 font-mono tabular-nums">
              {formatCurrency(summary.totalOutstanding)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Uncollected customer balances</p>
          </div>
        </div>

        <div className="double-bezel">
          <div className="double-bezel-inner !p-4">
            <span className="text-xs font-bold text-slate-500 uppercase">Overdue Collections</span>
            <p className="text-xl font-extrabold text-rose-600 mt-2 font-mono tabular-nums">
              {summary.overdueCount} Invoices
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Past stipulated Net-30 due date</p>
          </div>
        </div>

        <div className="double-bezel">
          <div className="double-bezel-inner !p-4">
            <span className="text-xs font-bold text-slate-500 uppercase">Settled Invoices</span>
            <p className="text-xl font-extrabold text-emerald-600 mt-2 font-mono tabular-nums">
              {summary.paidCount} Fully Paid
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Completed cash collections</p>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="double-bezel">
        <div className="double-bezel-inner !p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['ALL', 'Draft', 'Issued', 'Partially Paid', 'Paid', 'Overdue', 'Void'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Invoice # or Customer..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Invoices Master Table */}
      <div className="double-bezel">
        <div className="double-bezel-inner !p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Invoice Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 text-xs">
                    No commercial invoices found matching selection.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{inv.customer_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{inv.customer_phone || inv.customer_email || 'Direct Account'}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{inv.invoice_date}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{inv.due_date}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      <span className={inv.balance_due > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {formatCurrency(inv.balance_due)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        inv.status === 'Partially Paid' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        inv.status === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        inv.status === 'Draft' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                        inv.status === 'Void' ? 'bg-slate-200 text-slate-500 border-slate-300 line-through' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setSelectedInvoice(inv); setIsViewModalOpen(true); }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="View Invoice Details"
                        >
                          <Eye size={13} />
                        </button>

                        <button
                          onClick={() => printInvoice(inv, data?.settings)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                          title="Instant Print / PDF"
                        >
                          <Printer size={13} />
                        </button>

                        {inv.status === 'Draft' && (
                          <button
                            onClick={() => handleIssueInvoice(inv)}
                            className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] border border-blue-200"
                          >
                            Issue
                          </button>
                        )}

                        {inv.status !== 'Paid' && inv.status !== 'Void' && inv.status !== 'Draft' && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentForm({
                                amount: inv.balance_due,
                                payment_method: 'Bank Transfer',
                                payment_date: new Date().toISOString().slice(0, 10),
                                reference: `Ref-${inv.invoice_number}`
                              });
                              setIsPaymentModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] border border-emerald-200"
                          >
                            Pay
                          </button>
                        )}

                        {inv.status !== 'Void' && inv.status !== 'Paid' && (
                          <button
                            onClick={() => handleVoidInvoice(inv)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Void Invoice"
                          >
                            <XCircle size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Commercial Invoice */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Generate Commercial Invoice" maxWidth="max-w-3xl">
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Customer Account</label>
              <select
                value={invoiceForm.customer_id}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_id: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              >
                <option value="" disabled>Select billing customer...</option>
                <option value="cust-walkin">Walk-in Retail Customer (Default Counter)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name || c.company_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Invoice Date</label>
              <input
                type="date"
                value={invoiceForm.invoice_date}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono outline-none focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Payment Due Date</label>
              <input
                type="date"
                value={invoiceForm.due_date}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono outline-none focus:border-blue-600"
                required
              />
            </div>
          </div>

          {/* Dynamic Line Items */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">Invoice Line Items</span>
              <button
                type="button"
                onClick={addLineItem}
                className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1"
              >
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            {invoiceForm.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateLineItem(idx, 'name', e.target.value)}
                    placeholder="Product or Service description..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 outline-none focus:border-blue-600 text-xs"
                    required
                  />
                </div>

                <div className="w-20">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(idx, 'quantity', Number(e.target.value))}
                    placeholder="Qty"
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 text-center font-mono outline-none focus:border-blue-600 text-xs"
                    required
                  />
                </div>

                <div className="w-32">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.unit_price}
                    onChange={(e) => updateLineItem(idx, 'unit_price', Number(e.target.value))}
                    placeholder="Unit Price (PKR)"
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 text-right font-mono outline-none focus:border-blue-600 text-xs"
                    required
                  />
                </div>

                <div className="w-28 text-right font-mono font-bold text-slate-800">
                  {formatCurrency((Number(item.quantity) || 1) * (Number(item.unit_price) || 0))}
                </div>

                <button
                  type="button"
                  onClick={() => removeLineItem(idx)}
                  disabled={invoiceForm.items.length <= 1}
                  className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Form Totals */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-bold">{formatCurrency(formSubtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Sales Tax / GST (18%):</span>
              <span className="font-mono font-bold">{formatCurrency(formTax)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Invoice Amount (PKR):</span>
              <span className="text-blue-600 font-mono">{formatCurrency(formTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Payment Terms</label>
              <input
                type="text"
                value={invoiceForm.terms}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, terms: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Invoice Status</label>
              <select
                value={invoiceForm.status}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              >
                <option value="Issued">Issued (Adds to Customer Receivables)</option>
                <option value="Draft">Draft (Preliminary Quote)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
            >
              Generate Commercial Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Payment Against Invoice */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Record Customer Invoice Settlement">
        {selectedInvoice && (
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Invoice Number:</span>
                <span className="font-mono text-blue-600">{selectedInvoice.invoice_number}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Customer:</span>
                <span>{selectedInvoice.customer_name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Amount:</span>
                <span className="font-mono">{formatCurrency(selectedInvoice.total_amount)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-rose-600 pt-1 border-t border-blue-200">
                <span>Balance Due:</span>
                <span className="font-mono">{formatCurrency(selectedInvoice.balance_due)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Payment Amount (PKR)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max={selectedInvoice.balance_due}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono outline-none focus:border-blue-600 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Payment Method</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                >
                  <option value="Bank Transfer">Bank Wire / Electronic Transfer</option>
                  <option value="Cash">Cash Settlement</option>
                  <option value="Check">Commercial Check</option>
                  <option value="Online Payment Gateway">Online Payment Gateway</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Bank Reference #</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  placeholder="e.g. HBL-FT-992019"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800">
              <span className="font-bold">Double-Entry Accounting Reconciled:</span> This payment will debit Cash & Bank (#1010/#1020) and credit Accounts Receivable (#1100), reducing the customer balance.
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
              >
                Record Payment & Post Voucher
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Printable Commercial Invoice View */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Commercial Invoice Voucher" maxWidth="max-w-2xl">
        {selectedInvoice && (
          <div className="space-y-4 text-xs">
            <div id="printable-invoice" className="p-6 bg-white border border-slate-200 rounded-lg space-y-4 text-slate-800 shadow-inner">
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-extrabold text-blue-600 tracking-tight">NEXIS BUSINESS ERP</h2>
                  <p className="text-xs font-semibold text-slate-600">Enterprise Commercial Operations</p>
                  <p className="text-[10px] text-slate-400">NTN: 8934201-9 · Lahore, Pakistan</p>
                </div>
                <div className="text-right font-mono">
                  <h3 className="text-base font-extrabold text-slate-900">COMMERCIAL INVOICE</h3>
                  <p className="text-xs font-bold text-blue-600">{selectedInvoice.invoice_number}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Date: {selectedInvoice.invoice_date}</p>
                  <p className="text-[10px] text-slate-500">Due: {selectedInvoice.due_date}</p>
                </div>
              </div>

              {/* Billing Customer */}
              <div className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Bill To:</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedInvoice.customer_name}</p>
                  <p className="text-[11px] text-slate-500">{selectedInvoice.customer_phone || selectedInvoice.customer_email || 'Commercial Account'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Settlement Status:</span>
                  <p className="mt-0.5">
                    <span className="font-bold text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                      {selectedInvoice.status}
                    </span>
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-t border-slate-200 pt-2">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-medium text-slate-900">{item.name}</td>
                      <td className="py-2 text-center font-mono">{item.quantity}</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                      <td className="py-2 text-right font-mono font-bold">{formatCurrency(item.total || (item.quantity * item.unit_price))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold">{formatCurrency(selectedInvoice.subtotal || selectedInvoice.total_amount)}</span>
                  </div>
                  {selectedInvoice.tax_amount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Sales Tax (18% GST):</span>
                      <span className="font-mono font-bold">{formatCurrency(selectedInvoice.tax_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="font-mono text-blue-600">{formatCurrency(selectedInvoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Amount Paid:</span>
                    <span className="font-mono text-emerald-600 font-bold">{formatCurrency(selectedInvoice.amount_paid || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-rose-600 pt-1 border-t border-slate-200">
                    <span>Balance Due:</span>
                    <span className="font-mono">{formatCurrency(selectedInvoice.balance_due)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <p><span className="font-bold">Terms:</span> {selectedInvoice.terms || 'Net 30 days'}</p>
                  <p><span className="font-bold">Notes:</span> {selectedInvoice.notes || 'Official electronic commercial invoice.'}</p>
                </div>
                <div className="text-right">
                  <a
                    href="https://digitalerena.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-600 hover:underline inline-block"
                  >
                    Powered by digitalerena.com
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => printInvoice(selectedInvoice, data?.settings)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Printer size={14} />
                <span>Print / Download PDF</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
