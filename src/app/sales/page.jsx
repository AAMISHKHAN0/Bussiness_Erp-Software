'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Modal from '@/components/common/Modal';
import InvoiceModal from '@/components/common/InvoiceModal';
import SalesReportModal from '@/components/common/SalesReportModal';
import { useToast } from '@/context/ToastContext';
import { 
  ShoppingCart, Plus, Search, FileText, CheckCircle2, 
  Clock, DollarSign, Eye, Loader2, 
  Trash2, RefreshCw, Printer, Download,
  CreditCard, Ban
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export default function SalesPage() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [isSalesReportOpen, setIsSalesReportOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  // New Order Form State
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Net-30 Invoice');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [lineItems, setLineItems] = useState([
    { product_id: '', quantity: 1, unit_price: 0 }
  ]);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sales');
      const json = await res.json();
      if (json.success) {
        setOrders(json.data.orders || []);
        setCustomers(json.data.customers || []);
        setProducts(json.data.products || []);
        if (json.data.customers.length > 0 && !selectedCustomer) {
          setSelectedCustomer(json.data.customers[0].id);
        }
      } else {
        toast.error(json.message || 'Failed to load sales data');
      }
    } catch (err) {
      toast.error(err.message || 'Network error loading sales records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const handleExportCSV = () => {
    const headers = ['Order Number,Date,Customer,Payment Terms,Status,Payment Status,Net Amount'];
    const rows = orders.map(o => 
      `"${o.order_number}","${o.order_date || ''}","${o.customer_name || ''}","${o.payment_method || 'Net-30'}","${o.status || 'Confirmed'}","${o.payment_status || 'Pending'}",${parseFloat(o.net_amount || o.total_amount || 0).toFixed(2)}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.info('Exported sales manifest to CSV');
  };

  const handleCancelOrder = async (id, orderNumber) => {
    const reason = prompt(`Enter reason to VOID and cancel order ${orderNumber} (Inventory will be restocked and accounting reversed):`);
    if (!reason) return;

    try {
      const res = await fetch(`/api/sales?id=${id}&reason=${encodeURIComponent(reason)}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || `Order ${orderNumber} cancelled and reversed`);
        fetchSalesData();
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleProductSelect = (index, productId) => {
    const prod = products.find(p => p.id === productId);
    const updated = [...lineItems];
    updated[index].product_id = productId;
    updated[index].unit_price = prod ? Number(prod.selling_price) : 0;
    setLineItems(updated);
  };

  const handleQtyChange = (index, qty) => {
    const updated = [...lineItems];
    updated[index].quantity = Math.max(1, Number(qty));
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { product_id: products[0]?.id || '', quantity: 1, unit_price: products[0]?.selling_price || 0 }]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer,
          payment_method: paymentMethod,
          discount_amount: Number(discountAmount),
          items: lineItems
        })
      });
      const json = await res.json();
      if (json.success) {
        setIsCreateOpen(false);
        toast.success(`Sales Order ${json.data.order.order_number} generated & posted to ledger`);
        fetchSalesData();
        setLineItems([{ product_id: products[0]?.id || '', quantity: 1, unit_price: products[0]?.selling_price || 0 }]);
      } else {
        toast.error(json.message || 'Failed to issue order');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedPaymentOrder) return;
    try {
      const res = await fetch('/api/sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPaymentOrder.id,
          action: 'payment',
          payment_amount: paymentAmount
        })
      });
      const json = await res.json();
      if (json.success) {
        setIsPaymentModalOpen(false);
        toast.success(`Payment settled for ${selectedPaymentOrder.order_number}`);
        fetchSalesData();
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await fetch('/api/sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Order status set to ${newStatus}`);
        fetchSalesData();
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const validOrders = orders.filter(o => o.status !== 'Cancelled');
  const totalSalesVolume = validOrders.reduce((sum, o) => sum + (Number(o.net_amount) || Number(o.total_amount) || 0), 0);
  const totalPaid = validOrders.filter(o => o.payment_status === 'Paid').reduce((sum, o) => sum + (Number(o.net_amount) || Number(o.total_amount) || 0), 0);
  const pendingReceivables = totalSalesVolume - totalPaid;

  return (
    <AppShell>
      {/* Invoice Modal for Print / PDF */}
      <InvoiceModal
        isOpen={!!selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
        order={selectedInvoiceOrder}
      />

      {/* Sales Report Modal for Executive Audit & PDF */}
      <SalesReportModal
        isOpen={isSalesReportOpen}
        onClose={() => setIsSalesReportOpen(false)}
        orders={orders}
        customers={customers}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Sales Orders
            </h1>
            <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Commercial CRM
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Order lifecycle management, customer receivables status, and commercial double-entry invoices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchSalesData}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
          <button
            onClick={() => setIsSalesReportOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs flex items-center gap-2 transition-colors active:scale-98 cursor-pointer"
            title="Executive Sales Report & PDF Export"
          >
            <span className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <FileText size={12} />
            </span>
            <span>Sales Report (PDF)</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Download Sales Sheet (CSV)"
          >
            <Download size={14} />
            <span>Download Sheet</span>
          </button>
          <button
            onClick={() => {
              if (products.length > 0 && !lineItems[0].product_id) {
                setLineItems([{ product_id: products[0].id, quantity: 1, unit_price: products[0].selling_price }]);
              }
              setIsCreateOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Create Sales Order</span>
            <Plus size={13} className="text-white" />
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-1 rounded-[1.25rem] bg-slate-200/60 border border-slate-200/80 shadow-2xs">
          <div className="p-4 rounded-[1rem] bg-white border border-white/80 h-28 flex flex-col justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gross Sales Volume</p>
            <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{formatCurrency(totalSalesVolume)}</p>
            <p className="text-[10px] text-slate-400">{validOrders.length} active orders booked</p>
          </div>
        </div>
        <div className="p-1 rounded-[1.25rem] bg-slate-200/60 border border-slate-200/80 shadow-2xs">
          <div className="p-4 rounded-[1rem] bg-white border border-white/80 h-28 flex flex-col justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Settled (Paid)</p>
            <p className="text-2xl font-extrabold text-emerald-600 tabular-nums">{formatCurrency(totalPaid)}</p>
            <p className="text-[10px] text-slate-400">Direct wire & RTGS deposits</p>
          </div>
        </div>
        <div className="p-1 rounded-[1.25rem] bg-slate-200/60 border border-slate-200/80 shadow-2xs">
          <div className="p-4 rounded-[1rem] bg-white border border-white/80 h-28 flex flex-col justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Receivables Due</p>
            <p className="text-2xl font-extrabold text-amber-600 tabular-nums">{formatCurrency(pendingReceivables)}</p>
            <p className="text-[10px] text-slate-400">GAAP Account #1100 AR</p>
          </div>
        </div>
        <div className="p-1 rounded-[1.25rem] bg-slate-200/60 border border-slate-200/80 shadow-2xs">
          <div className="p-4 rounded-[1rem] bg-white border border-white/80 h-28 flex flex-col justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Average Order Size</p>
            <p className="text-2xl font-extrabold text-blue-600 tabular-nums">
              {formatCurrency(validOrders.length > 0 ? Math.round(totalSalesVolume / validOrders.length) : 0)}
            </p>
            <p className="text-[10px] text-slate-400">Commercial client average</p>
          </div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="p-1 rounded-[1.25rem] bg-slate-200/60 border border-slate-200/80 shadow-2xs">
        <div className="p-3 rounded-[1rem] bg-white border border-white/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by SO Number or Client Name..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['All', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === st 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="p-1 rounded-[1.25rem] bg-slate-200/60 border border-slate-200/80 shadow-2xs">
        <div className="rounded-[1rem] bg-white border border-white/80 overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading sales orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <ShoppingCart size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-700">No sales orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Order Number</th>
                    <th className="py-3 px-4">Client Entity</th>
                    <th className="py-3 px-4">Order Date</th>
                    <th className="py-3 px-4 text-right">Net Value</th>
                    <th className="py-3 px-4 text-center">Fulfillment Status</th>
                    <th className="py-3 px-4 text-center">Payment</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => {
                    const isCancelled = order.status === 'Cancelled';
                    return (
                      <tr key={order.id} className={`hover:bg-slate-50/70 transition-colors ${isCancelled ? 'opacity-60 bg-slate-50/40' : ''}`}>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                          {order.order_number}
                          {isCancelled && <span className="block text-[10px] text-purple-600 font-sans">VOIDED / CANCELLED</span>}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {order.customer_name}
                          <span className="block text-[10px] text-slate-400 font-normal">Terms: {order.payment_method}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">{order.order_date}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(order.net_amount || order.total_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isCancelled ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                              Cancelled
                            </span>
                          ) : (
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border outline-none cursor-pointer ${
                                order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                                order.status === 'Shipped' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                                order.status === 'Confirmed' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                                'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              <option value="Confirmed">Confirmed</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            order.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {order.payment_status === 'Paid' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                            {order.payment_status || 'Pending'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isCancelled && order.payment_status !== 'Paid' && (
                              <button
                                onClick={() => {
                                  setSelectedPaymentOrder(order);
                                  setPaymentAmount(Number(order.net_amount) || Number(order.total_amount) || 0);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-bold text-xs transition-colors border border-emerald-200 cursor-pointer"
                                title="Record Cash Receipt"
                              >
                                <CreditCard size={12} />
                                <span>Pay</span>
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedInvoiceOrder(order)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md font-bold text-xs transition-colors border border-slate-200 cursor-pointer"
                              title="View & Print Invoice"
                            >
                              <FileText size={13} className="text-blue-600" />
                              <span>Invoice</span>
                            </button>
                            {!isCancelled && (
                              <button
                                onClick={() => handleCancelOrder(order.id, order.order_number)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                title="Safe VOID & Restock"
                              >
                                <Ban size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Sales Order */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Commercial Sales Order" maxWidth="max-w-3xl">
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Corporate Client Account</label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (Credit: {formatCurrency(c.credit_limit)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Commercial Settlement Terms</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              >
                <option value="Net-30 Invoice">Net-30 Invoice</option>
                <option value="Net-45 Invoice">Net-45 Invoice</option>
                <option value="Wire Transfer (ACH)">Wire Transfer (ACH)</option>
                <option value="Corporate Credit Card">Corporate Credit Card</option>
              </select>
            </div>
          </div>

          {/* Line Items List */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">Line Items</span>
              <button
                type="button"
                onClick={addLineItem}
                className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            {lineItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex-1">
                  <select
                    value={item.product_id}
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 outline-none focus:border-blue-600"
                    required
                  >
                    <option value="" disabled>Select a catalog item...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku}) - {formatCurrency(p.selling_price)} ({p.quantity} avail)</option>
                    ))}
                  </select>
                </div>

                <div className="w-20">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQtyChange(idx, e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 text-center font-mono outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div className="w-28 text-right font-mono font-bold text-slate-900">
                  {formatCurrency(Number(item.quantity) * Number(item.unit_price))}
                </div>

                <button
                  type="button"
                  onClick={() => removeLineItem(idx)}
                  disabled={lineItems.length === 1}
                  className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Subtotal / Tax Calculation Preview */}
          <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
            <div className="w-48">
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Contract Discount (PKR)</label>
              <input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 font-mono outline-none focus:border-blue-600"
              />
            </div>

            <div className="text-right space-y-1 font-mono">
              <p className="text-slate-500">Subtotal: {formatCurrency(calculateSubtotal())}</p>
              <p className="text-slate-500">Estimated Tax (8.5%): {formatCurrency((Math.max(0, calculateSubtotal() - discountAmount)) * 0.085)}</p>
              <p className="text-base font-bold text-slate-900">
                Net Total: {formatCurrency(Math.max(0, calculateSubtotal() - discountAmount) * 1.085)}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
            >
              Issue Sales Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Customer Cash Receipt */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`Record Payment: ${selectedPaymentOrder?.order_number || ''}`}>
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <p className="text-slate-500 font-medium">Customer: <strong className="text-slate-900">{selectedPaymentOrder?.customer_name}</strong></p>
            <p className="text-slate-500 font-medium">Order Net Value: <strong className="text-slate-900 font-mono">{formatCurrency(selectedPaymentOrder?.net_amount || selectedPaymentOrder?.total_amount || 0)}</strong></p>
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Receipt Amount (PKR)</label>
            <input
              type="number"
              step="1"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none font-mono text-base font-bold focus:border-blue-600"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Posts GAAP Cash Receipt voucher: Debits Operating Checking #1010, Credits AR #1100.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
            >
              Confirm Cash Receipt
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
