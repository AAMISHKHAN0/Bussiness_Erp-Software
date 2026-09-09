'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Modal from '@/components/common/Modal';
import { useToast } from '@/context/ToastContext';
import { 
  Truck, Plus, Search, CheckCircle2, Clock, 
  PackageCheck, Loader2, Trash2, RefreshCw, Download,
  Check, XCircle, AlertTriangle, ShieldCheck
} from 'lucide-react';

export default function PurchasesPage() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [lineItems, setLineItems] = useState([{ product_id: '', quantity: 10, unit_price: 1500 }]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/purchases');
      const json = await res.json();
      if (json.success) {
        setOrders(json.data.orders || []);
        setSuppliers(json.data.suppliers || []);
        setProducts(json.data.products || []);
        if (json.data.suppliers.length > 0 && !selectedSupplier) {
          setSelectedSupplier(json.data.suppliers[0].id);
        }
      } else {
        toast.error(json.message || 'Failed to load purchase orders');
      }
    } catch (err) {
      toast.error('Network error loading procurement data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast.error('No procurement orders available to export');
      return;
    }
    const headers = ['PO Number,Supplier,Order Date,Expected Delivery,Total Amount,Status'];
    const rows = orders.map(o => 
      `"${o.order_number}","${o.supplier_name}","${o.order_date}","${o.expected_delivery_date || ''}",${parseFloat(o.total_amount || 0).toFixed(2)},"${o.status}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Procurement_POs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Procurement manifest exported to CSV');
  };

  const handleCancelPO = async (id, orderNumber) => {
    if (!confirm(`Are you sure you want to cancel Purchase Order ${orderNumber}? Any associated accounting accruals will be reversed.`)) return;
    try {
      const res = await fetch(`/api/purchases?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success(`Purchase Order ${orderNumber} cancelled and accrued liabilities reversed`);
        fetchData();
      } else {
        toast.error(json.message || 'Failed to cancel purchase order');
      }
    } catch (err) {
      toast.error(err.message || 'Network error cancelling purchase order');
    }
  };

  const handleApprovePO = async (orderId, orderNumber) => {
    try {
      const res = await fetch('/api/purchases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, action: 'approve' })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Purchase Order ${orderNumber} authorized and converted to active order`);
        fetchData();
      } else {
        toast.error(json.message || 'Failed to approve purchase order');
      }
    } catch (err) {
      toast.error(err.message || 'Network error approving purchase order');
    }
  };

  const handleReceiveGoods = async (orderId, orderNumber) => {
    if (!confirm(`Confirm goods receipt note (GRN) for ${orderNumber}? This will immediately record warehouse intake and restock inventory.`)) return;
    try {
      const res = await fetch('/api/purchases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, action: 'receive' })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`GRN recorded! Stock movements ledger and inventory valuations updated`);
        fetchData();
      } else {
        toast.error(json.message || 'Goods receipt failed');
      }
    } catch (err) {
      toast.error(err.message || 'Network error receiving goods');
    }
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: selectedSupplier,
          expected_delivery_date: expectedDate,
          items: lineItems
        })
      });
      const json = await res.json();
      if (json.success) {
        if (json.approval_required) {
          toast.info(`Purchase Order submitted! Amount exceeds $10,000 threshold and is queued for executive approval.`);
        } else {
          toast.success(`Purchase Order generated successfully`);
        }
        setIsCreateOpen(false);
        fetchData();
      } else {
        toast.error(json.message || 'Failed to create purchase order');
      }
    } catch (err) {
      toast.error(err.message || 'Network error creating purchase order');
    }
  };

  const addLine = () => {
    setLineItems([...lineItems, { product_id: products[0]?.id || '', quantity: 10, unit_price: products[0]?.purchase_price || 1500 }]);
  };

  const removeLine = (idx) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };


  const filtered = orders.filter(o => 
    o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProcurement = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const receivedVolume = orders.filter(o => o.status === 'Received').reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const pendingVolume = totalProcurement - receivedVolume;

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Procurement & Purchase Orders
            </h1>
            <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Supply Chain
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supplier purchase orders, goods receipt notes (GRN), and warehouse restocking automation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Download Procurement Sheet (CSV)"
          >
            <Download size={14} />
            <span>Download Sheet</span>
          </button>
          <button
            onClick={() => {
              if (products.length > 0 && !lineItems[0].product_id) {
                setLineItems([{ product_id: products[0].id, quantity: 10, unit_price: products[0].purchase_price }]);
              }
              setIsCreateOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Draft Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Procurement Value</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">${totalProcurement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-slate-400 mt-1">{orders.length} total purchase orders</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Goods Received & Restocked</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">${receivedVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-slate-400 mt-1">Capitalized to Inventory #1200</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Inbound Transit / Pending</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">${pendingVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-slate-400 mt-1">Expected delivery this month</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Supply Partners</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{suppliers.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Direct enterprise distributors</p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by PO number or Supplier..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs font-bold text-slate-500">Loading purchase orders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Truck size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-sm text-slate-700">No purchase orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier Partner</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Expected Delivery</th>
                  <th className="py-3 px-4 text-right">Commitment Value</th>
                  <th className="py-3 px-4 text-center">Fulfillment Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{po.order_number}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{po.supplier_name}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">{po.order_date}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">{po.expected_delivery_date || 'Pending'}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ${parseFloat(po.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        po.status === 'Received' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        po.status === 'Ordered' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                        po.status === 'Pending Approval' ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse' :
                        po.status === 'Cancelled' ? 'bg-slate-100 text-slate-500 border-slate-300 line-through' :
                        'bg-slate-50 text-slate-700 border-slate-300'
                      }`}>
                        {po.status === 'Received' ? <CheckCircle2 size={11} /> :
                         po.status === 'Pending Approval' ? <ShieldCheck size={11} /> :
                         po.status === 'Cancelled' ? <XCircle size={11} /> :
                         <Clock size={11} />}
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {po.status === 'Pending Approval' && (
                          <button
                            onClick={() => handleApprovePO(po.id, po.order_number)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-xs transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                            title="Approve high-value purchase order"
                          >
                            <Check size={13} />
                            <span>Authorize</span>
                          </button>
                        )}
                        {po.status === 'Ordered' && (
                          <button
                            onClick={() => handleReceiveGoods(po.id, po.order_number)}
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-bold text-xs transition-colors border border-emerald-300 flex items-center gap-1.5 cursor-pointer"
                          >
                            <PackageCheck size={14} />
                            <span>Receive Shipment</span>
                          </button>
                        )}
                        {po.status === 'Received' && (
                          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={13} /> Restocked
                          </span>
                        )}
                        {po.status === 'Cancelled' && (
                          <span className="text-[11px] font-semibold text-slate-400">
                            Voided
                          </span>
                        )}
                        {po.status !== 'Received' && po.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleCancelPO(po.id, po.order_number)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                            title="Cancel Purchase Order and Reverse Accruals"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Purchase Order */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Issue Purchase Order (PO)" maxWidth="max-w-2xl">
        <form onSubmit={handleCreatePO} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Supplier Partner</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">Restock Items</span>
              <button
                type="button"
                onClick={addLine}
                className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            {lineItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex-1">
                  <select
                    value={item.product_id}
                    onChange={(e) => {
                      const prod = products.find(p => p.id === e.target.value);
                      const updated = [...lineItems];
                      updated[idx].product_id = e.target.value;
                      updated[idx].unit_price = prod ? prod.purchase_price : 0;
                      setLineItems(updated);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 outline-none focus:border-blue-600"
                    required
                  >
                    <option value="" disabled>Select SKU to procure...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Cost: ${p.purchase_price})</option>
                    ))}
                  </select>
                </div>

                <div className="w-20">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const updated = [...lineItems];
                      updated[idx].quantity = Math.max(1, Number(e.target.value));
                      setLineItems(updated);
                    }}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 text-center font-mono outline-none focus:border-blue-600"
                    required
                  />
                </div>

                <div className="w-28 text-right font-mono font-bold text-slate-900">
                  ${(Number(item.quantity) * Number(item.unit_price)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>

                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  disabled={lineItems.length === 1}
                  className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
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
              Transmit Purchase Order
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
