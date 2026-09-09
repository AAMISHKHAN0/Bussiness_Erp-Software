'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Modal from '@/components/common/Modal';
import { 
  Package, Plus, Search, AlertTriangle, 
  Download, Trash2, ArrowUpDown, 
  RefreshCw, Loader2, MapPin
} from 'lucide-react';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterCriticalOnly, setFilterCriticalOnly] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState(0);

  // Form State
  const [form, setForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    category_name: 'Enterprise Rack Servers',
    purchase_price: 1500,
    selling_price: 2800,
    quantity: 10,
    min_stock_level: 5,
    location: 'Warehouse Bay A-01',
    supplier_name: 'Ingram Micro Global Distribution'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory');
      const json = await res.json();
      if (json.success) {
        setProducts(json.data.products || []);
        setCategories(json.data.categories || []);
        setSuppliers(json.data.suppliers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        setIsAddModalOpen(false);
        fetchData();
        setForm({
          name: '',
          sku: '',
          barcode: '',
          category_name: 'Enterprise Rack Servers',
          purchase_price: 1500,
          selling_price: 2800,
          quantity: 10,
          min_stock_level: 5,
          location: 'Warehouse Bay A-01',
          supplier_name: 'Ingram Micro Global Distribution'
        });
      } else {
        alert(json.message);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const res = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedProduct.id,
          action: 'adjust',
          adjustment: adjustAmount,
          reason: 'Manual Inventory Cycle Count'
        })
      });
      const json = await res.json();
      if (json.success) {
        setIsAdjustModalOpen(false);
        fetchData();
      } else {
        alert(json.message);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to retire this product SKU from active catalog?')) return;
    try {
      const res = await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExportCSV = () => {
    const headers = ['SKU,Name,Category,Stock,MinStock,BuyPrice,SellPrice,Location,Status'];
    const rows = products.map(p => 
      `"${p.sku}","${p.name}","${p.category_name}",${p.quantity},${p.min_stock_level},${p.purchase_price},${p.selling_price},"${p.location}","${p.status}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_Catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered list
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));

    const matchesCategory = selectedCategory === 'All' || p.category_name === selectedCategory;
    const matchesCritical = !filterCriticalOnly || Number(p.quantity) <= Number(p.min_stock_level);

    return matchesSearch && matchesCategory && matchesCritical;
  });

  const totalCostValuation = products.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.purchase_price)), 0);
  const totalRetailValuation = products.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.selling_price)), 0);
  const criticalCount = products.filter(p => Number(p.quantity) <= Number(p.min_stock_level)).length;

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Inventory & Items
            </h1>
            <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Warehouse Catalog
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time SKU catalog, location bin allocations, and safety reorder thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-pod-blue group"
          >
            <span>Register New SKU</span>
            <span className="pod-icon">
              <Plus size={13} className="text-white" />
            </span>
          </button>
        </div>
      </div>

      {/* Metrics Banner with Double-Bezel Architecture */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="double-bezel">
          <div className="double-bezel-inner">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Active SKUs</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{products.length}</p>
            <p className="text-[10px] text-slate-400 mt-1">Across 5 classifications</p>
          </div>
        </div>
        <div className="double-bezel">
          <div className="double-bezel-inner">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Asset Valuation (Cost)</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-1 tabular-nums">${totalCostValuation.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 mt-1">GAAP Account #1200 Inventory</p>
          </div>
        </div>
        <div className="double-bezel">
          <div className="double-bezel-inner">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Projected Retail Value</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">${totalRetailValuation.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 mt-1">~{Math.round(((totalRetailValuation - totalCostValuation) / (totalRetailValuation || 1)) * 100)}% Average Markup</p>
          </div>
        </div>
        <div className="double-bezel">
          <div className="double-bezel-inner">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Low Stock Warnings</p>
            <p className={`text-2xl font-extrabold mt-1 tabular-nums ${criticalCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {criticalCount} SKUs
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Below minimum safe threshold</p>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="double-bezel">
        <div className="double-bezel-inner !p-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Product Name, SKU, or Barcode..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Classifications</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            <button
              onClick={() => setFilterCriticalOnly(!filterCriticalOnly)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                filterCriticalOnly 
                  ? 'bg-amber-50 text-amber-700 border-amber-300' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
            >
              <AlertTriangle size={13} />
              <span>Low Stock Alert</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table with Double-Bezel Frame */}
      <div className="double-bezel">
        <div className="double-bezel-inner !p-0 overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading catalog items...</p>
            </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Package size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-sm text-slate-700">No products matched the filter criteria</p>
            <p className="text-xs mt-1 text-slate-500">Try clearing filters or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-4">SKU & Barcode</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4 text-right">Cost / Selling</th>
                  <th className="py-3 px-4 text-center">In Stock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isCritical = Number(p.quantity) <= Number(p.min_stock_level);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {p.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin size={10} className="text-slate-400" /> {p.location || 'Warehouse Bay'}
                          </span>
                          <span>·</span>
                          <span>{p.supplier_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-blue-600">{p.sku}</div>
                        <div className="text-[10px] text-slate-400">{p.barcode || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {p.category_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <div className="text-slate-500 text-[11px]">${Number(p.purchase_price).toFixed(2)}</div>
                        <div className="font-bold text-slate-900">${Number(p.selling_price).toFixed(2)}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold font-mono border ${
                            isCritical ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}>
                            {p.quantity} {p.unit || 'Units'}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5">Min: {p.min_stock_level}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setAdjustAmount(0);
                              setIsAdjustModalOpen(true);
                            }}
                            className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Adjust Stock Quantity"
                          >
                            <ArrowUpDown size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete SKU"
                          >
                            <Trash2 size={15} />
                          </button>
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

      {/* Modal: Register New SKU */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Commercial SKU">
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Product Description / Title</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Cisco Catalyst 9300 48-Port Switch"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">SKU Code</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="CSCO-CAT-9300"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Barcode (EAN/UPC)</label>
              <input
                type="text"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="8901234567899"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Classification</label>
              <select
                value={form.category_name}
                onChange={(e) => setForm({ ...form, category_name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              >
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Supplier</label>
              <select
                value={form.supplier_name}
                onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              >
                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Cost Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={form.purchase_price}
                onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none font-mono focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Selling Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={form.selling_price}
                onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none font-mono focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Initial Stock Quantity</label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none font-mono focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Safety Threshold Alert</label>
              <input
                type="number"
                value={form.min_stock_level}
                onChange={(e) => setForm({ ...form, min_stock_level: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none font-mono focus:border-blue-600"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Warehouse Bin / Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Warehouse Bay A-12"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
            >
              Save SKU to Catalog
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Adjust Stock */}
      <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title={`Stock Adjustment: ${selectedProduct?.name}`}>
        <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <p className="text-slate-600 font-medium">SKU: <span className="font-mono font-bold text-blue-600">{selectedProduct?.sku}</span></p>
            <p className="text-slate-600 font-medium">Current Stock on Hand: <span className="font-bold text-slate-900">{selectedProduct?.quantity} Units</span></p>
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">
              Quantity Adjustment (+ to add, - to reduce)
            </label>
            <input
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(Number(e.target.value))}
              placeholder="e.g. +10 or -5"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none font-mono focus:border-blue-600 text-sm"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              New Projected Balance: <strong className="text-slate-900">{Math.max(0, (selectedProduct?.quantity || 0) + adjustAmount)} Units</strong>
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
            >
              Apply Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
