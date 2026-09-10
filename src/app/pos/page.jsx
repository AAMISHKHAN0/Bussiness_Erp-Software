'use client';

import React, { useState, useEffect, useRef } from 'react';
import AppShell from '@/components/layout/AppShell';
import Modal from '@/components/common/Modal';
import { useToast } from '@/context/ToastContext';
import { 
  Search, Barcode, ShoppingCart, Plus, Minus, Trash2, 
  CreditCard, Banknote, Building, RotateCcw, Pause, 
  Play, Printer, CheckCircle2, AlertCircle, RefreshCw, 
  User, Layers, ArrowRight, ShieldCheck, X, Receipt, 
  Sparkles, History, Download
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export default function POSPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Active Sale State
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('cust-walkin');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(18); // Default 18% GST in PKR
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [saleNotes, setSaleNotes] = useState('');

  // Modals & Drawers
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const barcodeInputRef = useRef(null);

  const fetchPOSData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pos');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (json.data.settings?.default_tax_rate) {
          setTaxPercent(Number(json.data.settings.default_tax_rate) || 18);
        }
      } else {
        toast.error(json.message || 'Failed to load POS data');
      }
    } catch (err) {
      toast.error('Network error loading POS register');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOSData();
  }, []);

  const products = data?.products || [];
  const customers = data?.customers || [];
  const categories = data?.categories || ['All'];
  const heldSales = data?.heldSales || [];
  const recentSales = data?.recentSales || [];
  const activeSession = data?.activeSession;

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesQuery = !searchQuery || 
      p.name.toLowerCase().includes(query) || 
      p.sku.toLowerCase().includes(query) || 
      (p.barcode && p.barcode.toLowerCase().includes(query));
    return matchesCat && matchesQuery;
  });

  // Handle Barcode Scan / Fast Enter
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const code = barcodeInput.trim().toLowerCase();
    const found = products.find(p => 
      (p.barcode && p.barcode.toLowerCase() === code) || 
      p.sku.toLowerCase() === code ||
      p.name.toLowerCase() === code
    );

    if (found) {
      addToCart(found);
      setBarcodeInput('');
      toast.success(`Scanned: ${found.name}`);
    } else {
      toast.error(`Barcode/SKU "${barcodeInput}" not found in inventory`);
    }
  };

  // Cart operations
  const addToCart = (product) => {
    if (product.quantity <= 0) {
      toast.error(`${product.name} is Out of Stock`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          toast.warning(`Cannot exceed available stock (${product.quantity})`);
          return prev;
        }
        return prev.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price }
            : item
        );
      } else {
        return [...prev, {
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          unit_price: product.selling_price,
          max_qty: product.quantity,
          quantity: 1,
          total: product.selling_price
        }];
      }
    });
  };

  const updateQuantity = (productId, newQty) => {
    const qty = Number(newQty);
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        if (qty > item.max_qty) {
          toast.warning(`Maximum available stock is ${item.max_qty}`);
          return { ...item, quantity: item.max_qty, total: item.max_qty * item.unit_price };
        }
        return { ...item, quantity: qty, total: qty * item.unit_price };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setAmountTendered('');
    setSaleNotes('');
  };

  // Computations
  const subtotal = cart.reduce((s, i) => s + (Number(i.total) || 0), 0);
  const discountAmount = Math.round((subtotal * (Number(discountPercent) || 0) / 100) * 100) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((taxableAmount * (Number(taxPercent) || 0) / 100) * 100) / 100;
  const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

  const tendered = Number(amountTendered) || grandTotal;
  const changeDue = Math.max(0, tendered - grandTotal);

  // Complete Sale
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty. Add products to proceed.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        action: 'complete-sale',
        customer_id: selectedCustomerId,
        items: cart,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: grandTotal,
        payment_method: paymentMethod,
        amount_tendered: tendered,
        change_amount: changeDue,
        notes: saleNotes
      };

      const res = await fetch('/api/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Sale recorded and inventory adjusted!');
        setActiveReceipt(json.data?.sale);
        setIsReceiptModalOpen(true);
        clearCart();
        fetchPOSData();
      } else {
        toast.error(json.message || 'Failed to complete sale');
      }
    } catch (err) {
      toast.error(err.message || 'Network error processing checkout');
    } finally {
      setSubmitting(false);
    }
  };

  // Hold Sale
  const handleHoldSale = async () => {
    if (cart.length === 0) {
      toast.error('Cannot hold an empty cart');
      return;
    }
    try {
      const customer = customers.find(c => c.id === selectedCustomerId);
      const res = await fetch('/api/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'hold-sale',
          items: cart,
          customer_id: selectedCustomerId,
          customer_name: customer?.name || 'Walk-in Customer',
          subtotal,
          total_amount: grandTotal,
          reference_note: `Cart (${cart.length} items) - PKR ${grandTotal.toLocaleString()}`
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Sale held in queue');
        clearCart();
        fetchPOSData();
      } else {
        toast.error(json.message || 'Failed to hold sale');
      }
    } catch (err) {
      toast.error('Network error holding sale');
    }
  };

  // Resume Held Sale
  const handleResumeSale = async (heldSale) => {
    try {
      const res = await fetch('/api/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resume-sale',
          held_id: heldSale.id
        })
      });
      const json = await res.json();
      if (json.success) {
        setCart(heldSale.items || []);
        setSelectedCustomerId(heldSale.customer_id || 'cust-walkin');
        setIsHeldModalOpen(false);
        toast.success('Held sale restored to register');
        fetchPOSData();
      } else {
        toast.error(json.message || 'Failed to resume sale');
      }
    } catch (err) {
      toast.error('Error resuming held sale');
    }
  };

  // Refund Sale
  const handleRefund = async (sale) => {
    const reason = prompt(`Enter reason for refunding receipt #${sale.receipt_number}:`, 'Customer Return');
    if (!reason) return;

    try {
      const res = await fetch('/api/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refund',
          sale_id: sale.id,
          reason
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Sale refunded and stock returned to inventory');
        fetchPOSData();
      } else {
        toast.error(json.message || 'Refund rejected');
      }
    } catch (err) {
      toast.error('Error processing refund');
    }
  };

  // Quick Key: Focus barcode on load
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [loading]);

  return (
    <AppShell>
      {/* Top POS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <ShoppingCart size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                Point of Sale (POS)
              </h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Register #01 · Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              High-speed retail counter, barcode scanning, instant stock dispatch, and GAAP double-entry posting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHeldModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-800 flex items-center gap-1.5 transition-colors"
          >
            <Pause size={13} />
            <span>Held Carts ({heldSales.length})</span>
          </button>
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <History size={13} />
            <span>Sales History</span>
          </button>
          <button
            onClick={fetchPOSData}
            className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors shadow-2xs"
            title="Refresh Inventory"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {/* Main Dual-Pane POS Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
        {/* LEFT COLUMN: Catalog, Search, Barcode (7 Cols) */}
        <div className="lg:col-span-7 space-y-3 flex flex-col">
          {/* Fast Search & Barcode Scanner Bar */}
          <div className="double-bezel">
            <div className="double-bezel-inner !p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                {/* Barcode Fast Scan Input */}
                <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
                  <Barcode size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Scan Barcode or Type SKU + Enter..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </form>

                {/* Name Filter Input */}
                <div className="flex-1 relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter products by title..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="double-bezel flex-1 min-h-[440px]">
            <div className="double-bezel-inner !p-3">
              {filteredProducts.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs">
                  No products found matching criteria.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {filteredProducts.map(p => {
                    const isOutOfStock = p.quantity <= 0;
                    const inCart = cart.find(c => c.product_id === p.id);
                    return (
                      <button
                        key={p.id}
                        disabled={isOutOfStock}
                        onClick={() => addToCart(p)}
                        className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between relative group ${
                          isOutOfStock 
                            ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                            : inCart 
                              ? 'bg-blue-50/50 border-blue-300 hover:border-blue-500 shadow-2xs' 
                              : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50/50 shadow-2xs'
                        }`}
                      >
                        {inCart && (
                          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                            {inCart.quantity}
                          </span>
                        )}
                        <div>
                          <span className="text-[9px] font-mono font-bold uppercase text-slate-400 block truncate">
                            {p.sku}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-2 leading-snug">
                            {p.name}
                          </h4>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-extrabold font-mono text-blue-700">
                            {formatCurrency(p.selling_price)}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                            isOutOfStock 
                              ? 'bg-rose-50 text-rose-700' 
                              : p.quantity <= p.min_stock_level 
                                ? 'bg-amber-50 text-amber-700' 
                                : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {isOutOfStock ? '0 qty' : `${p.quantity} left`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Cart, Tender & Checkout (5 Cols) */}
        <div className="lg:col-span-5 space-y-3 flex flex-col">
          {/* Customer Selection & Quick Actions */}
          <div className="double-bezel">
            <div className="double-bezel-inner !p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <User size={13} /> Customer Account
                </span>
                <button
                  onClick={() => setSelectedCustomerId('cust-walkin')}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Reset to Walk-in
                </button>
              </div>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="cust-walkin">Walk-in Retail Customer (Default)</option>
                {customers.filter(c => c.id !== 'cust-walkin').map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''} — Bal: {formatCurrency(c.current_balance)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cart Items Table */}
          <div className="double-bezel flex-1 min-h-[220px]">
            <div className="double-bezel-inner !p-0 overflow-hidden flex flex-col justify-between h-full">
              <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <span className="text-xs font-bold text-slate-800">
                  Cart Order Items ({cart.length})
                </span>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Clear
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[260px]">
                {cart.length === 0 ? (
                  <div className="py-14 text-center text-slate-400 text-xs">
                    Cart is empty. Click items or scan barcodes to begin sale.
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.product_id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50">
                      <div className="flex-1 pr-2">
                        <p className="font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {formatCurrency(item.unit_price)} each
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                        >
                          <Minus size={11} />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product_id, e.target.value)}
                          className="w-10 text-center font-mono font-bold text-xs bg-slate-50 border border-slate-200 rounded py-0.5 outline-none focus:border-blue-600"
                        />
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <div className="w-24 text-right">
                        <span className="font-mono font-bold text-slate-900 text-xs tabular-nums">
                          {formatCurrency(item.total)}
                        </span>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="p-1 text-slate-300 hover:text-rose-600 transition-colors ml-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Order Calculations & Discounts */}
              <div className="p-3 bg-slate-50/90 border-t border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold tabular-nums">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span>Discount (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                      className="w-12 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-center text-xs outline-none focus:border-blue-600"
                    />
                  </div>
                  <span className="font-mono text-rose-600 font-bold tabular-nums">
                    -{formatCurrency(discountAmount)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>GST / Sales Tax ({taxPercent}%)</span>
                  <span className="font-mono font-bold tabular-nums">{formatCurrency(taxAmount)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-slate-900">
                  <span className="uppercase tracking-wider">Net Total (PKR)</span>
                  <span className="text-xl font-mono text-blue-600 tabular-nums">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Tender & Complete Sale Button */}
          <div className="double-bezel">
            <div className="double-bezel-inner !p-3 space-y-3">
              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Cash', label: 'Cash', icon: Banknote },
                  { id: 'Card', label: 'POS Card', icon: CreditCard },
                  { id: 'Bank Transfer', label: 'Bank Transfer', icon: Building },
                ].map(m => {
                  const Icon = m.icon;
                  const isSel = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2 rounded-lg border text-center font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                        isSel 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Amount Tendered (for Cash) */}
              {paymentMethod === 'Cash' && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">
                      Amount Tendered
                    </label>
                    <input
                      type="number"
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(e.target.value)}
                      placeholder={grandTotal.toString()}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">
                      Change Due
                    </label>
                    <div className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded font-mono font-extrabold text-emerald-700 text-xs">
                      {formatCurrency(changeDue)}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons: Hold and Complete */}
              <div className="flex gap-2">
                <button
                  onClick={handleHoldSale}
                  disabled={cart.length === 0}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Pause size={14} />
                  <span>Hold</span>
                </button>

                <button
                  onClick={handleCompleteSale}
                  disabled={cart.length === 0 || submitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  {submitting ? (
                    <RefreshCw size={16} className="animate-spin text-white" />
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      <span>Complete Sale ({formatCurrency(grandTotal)})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Thermal Printable Receipt */}
      <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title="Thermal POS Sales Receipt" maxWidth="max-w-md">
        {activeReceipt && (
          <div className="space-y-4 text-xs">
            {/* Printable Thermal Slip */}
            <div id="thermal-receipt" className="p-5 bg-white border border-slate-200 rounded-lg space-y-3 font-mono text-slate-900 shadow-inner">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <h3 className="text-base font-extrabold uppercase tracking-wider">NEXIS BUSINESS ERP</h3>
                <p className="text-[10px] text-slate-500">Retail Outlet & POS Counter</p>
                <p className="text-[10px] text-slate-500">NTN: 8934201-9 · Lahore, Pakistan</p>
              </div>

              <div className="text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Receipt #:</span>
                  <span className="font-bold">{activeReceipt.receipt_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date/Time:</span>
                  <span>{new Date(activeReceipt.sale_date).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>{activeReceipt.cashier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{activeReceipt.customer_name}</span>
                </div>
              </div>

              {/* Items */}
              <div className="py-2 border-y border-dashed border-slate-300 space-y-1.5">
                {activeReceipt.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div className="flex-1 truncate pr-2">
                      <span>{item.name}</span>
                      <span className="text-[9px] text-slate-400 block">{item.quantity} x {formatCurrency(item.unit_price)}</span>
                    </div>
                    <span className="font-bold">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(activeReceipt.subtotal)}</span>
                </div>
                {activeReceipt.discount_amount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(activeReceipt.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax (GST):</span>
                  <span>{formatCurrency(activeReceipt.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold pt-1 border-t border-slate-300">
                  <span>TOTAL PAID:</span>
                  <span className="text-blue-600">{formatCurrency(activeReceipt.total_amount)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Method:</span>
                  <span>{activeReceipt.payment_method}</span>
                </div>
                {activeReceipt.change_amount > 0 && (
                  <div className="flex justify-between text-[10px] text-emerald-700">
                    <span>Change Returned:</span>
                    <span>{formatCurrency(activeReceipt.change_amount)}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[9px] text-slate-400">
                <p>Thank you for your business!</p>
                <p>Retain receipt for standard 7-day returns.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Printer size={14} />
                <span>Print Thermal Slip</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Held Sales Queue */}
      <Modal isOpen={isHeldModalOpen} onClose={() => setIsHeldModalOpen(false)} title="Suspended / Held Carts" maxWidth="max-w-lg">
        <div className="space-y-3 text-xs">
          {heldSales.length === 0 ? (
            <p className="py-8 text-center text-slate-400">No sales currently on hold.</p>
          ) : (
            heldSales.map(held => (
              <div key={held.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{held.reference_note}</p>
                  <p className="text-[10px] text-slate-500">
                    Customer: {held.customer_name} · Held at: {new Date(held.held_at).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => handleResumeSale(held)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1"
                >
                  <Play size={12} />
                  <span>Resume</span>
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Modal: Recent Sales History & Refunds */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="Recent POS Sales History" maxWidth="max-w-2xl">
        <div className="space-y-3 text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-2 px-3">Receipt #</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3">Payment</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3 text-right">Amount</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{sale.receipt_number}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{sale.customer_name}</td>
                  <td className="py-2.5 px-3 text-slate-500">{sale.payment_method}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sale.status === 'Refunded' 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {sale.status || 'Completed'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(sale.total_amount)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {sale.status !== 'Refunded' ? (
                      <button
                        onClick={() => handleRefund(sale)}
                        className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] border border-rose-200"
                      >
                        Refund
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">Refunded</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </AppShell>
  );
}
