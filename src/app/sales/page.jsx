'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Modal from '@/components/common/Modal';
import InvoiceModal from '@/components/common/InvoiceModal';
import { 
  ShoppingCart, Plus, Search, FileText, CheckCircle2, 
  Clock, DollarSign, Eye, Loader2, 
  Trash2, RefreshCw
} from 'lucide-react';

export default function SalesPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

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
        fetchSalesData();
        setLineItems([{ product_id: products[0]?.id || '', quantity: 1, unit_price: products[0]?.selling_price || 0 }]);
      } else {
        alert(json.message);
      }
    } catch (err) {
      alert(err.message);
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
      if (json.success) fetchSalesData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSalesVolume = orders.reduce((sum, o) => sum + (Number(o.net_amount) || 0), 0);
  const totalPaid = orders.filter(o => o.payment_status === 'Paid').reduce((sum, o) => sum + (Number(o.net_amount) || 0), 0);
  const pendingReceivables = totalSalesVolume - totalPaid;

  return (
    <AppShell>
      {/* Invoice Modal for Print / PDF */}
      <InvoiceModal
        isOpen={!!selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
        order={selectedInvoiceOrder}
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
            Order lifecycle management, customer billing status, and commercial invoices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchSalesData}
            className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
          <button
            onClick={() => {
              if (products.length > 0 && !lineItems[0].product_id) {
                setLineItems([{ product_id: products[0].id, quantity: 1, unit_price: products[0].selling_price }]);
              }
              setIsCreateOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors active:scale-95"
          >
            <Plus size={16} />
            <span>Create Sales Order</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gross Sales Volume</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">${totalSalesVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-slate-400 mt-1">{orders.length} total orders recorded</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Settled (Paid)</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-slate-400 mt-1">Direct wire & ACH deposits</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Receivables Due</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">${pendingReceivables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-slate-400 mt-1">GAAP Account #1100 AR</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Average Order Size</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">
            ${orders.length > 0 ? Math.round(totalSalesVolume / orders.length).toLocaleString() : 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Commercial client average</p>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
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
          {['All', 'Confirmed', 'Shipped', 'Delivered', 'Draft'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === st 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
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
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {order.order_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {order.customer_name}
                      <span className="block text-[10px] text-slate-400 font-normal">Terms: {order.payment_method}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">{order.order_date}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ${parseFloat(order.net_amount || order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
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
                        <option value="Draft">Draft</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                      </select>
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
                      <button
                        onClick={() => setSelectedInvoiceOrder(order)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md font-bold text-xs transition-colors border border-slate-200"
                        title="View & Print Invoice"
                      >
                        <FileText size={13} className="text-blue-600" />
                        <span>Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                  <option key={c.id} value={c.id}>{c.name} (Credit: ${Number(c.credit_limit).toLocaleString()})</option>
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
                className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1"
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
                      <option key={p.id} value={p.id}>{p.name} ({p.sku}) - ${p.selling_price}</option>
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
                  ${(Number(item.quantity) * Number(item.unit_price)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>

                <button
                  type="button"
                  onClick={() => removeLineItem(idx)}
                  disabled={lineItems.length === 1}
                  className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Subtotal / Tax Calculation Preview */}
          <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
            <div className="w-48">
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Contract Discount ($)</label>
              <input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 font-mono outline-none focus:border-blue-600"
              />
            </div>

            <div className="text-right space-y-1 font-mono">
              <p className="text-slate-500">Subtotal: ${calculateSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              <p className="text-slate-500">Estimated Tax (8.5%): ${((Math.max(0, calculateSubtotal() - discountAmount)) * 0.085).toFixed(2)}</p>
              <p className="text-base font-bold text-slate-900">
                Net Total: ${(Math.max(0, calculateSubtotal() - discountAmount) * 1.085).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
            >
              Issue Sales Order
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
