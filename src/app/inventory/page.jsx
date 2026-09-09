'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Modal from '@/components/common/Modal';
import { useToast } from '@/context/ToastContext';
import { 
  Package, Plus, Search, AlertTriangle, 
  Download, Trash2, ArrowUpDown, 
  RefreshCw, Loader2, MapPin, Pencil,
  ArrowRightLeft, History, Building2
} from 'lucide-react';

import Button from '@/components/common/Button';
import EnterpriseTable from '@/components/common/EnterpriseTable';
import { formatCurrency } from '@/lib/currency';

export default function InventoryPage() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterCriticalOnly, setFilterCriticalOnly] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  // Transfer Form State
  const [transferForm, setTransferForm] = useState({
    product_id: '',
    source_warehouse_id: 'wh-1',
    target_warehouse_id: 'wh-2',
    quantity: 1,
    notes: ''
  });

  // Create Form State
  const [form, setForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    category_name: 'Enterprise Rack Servers',
    purchase_price: 320000,
    selling_price: 550000,
    quantity: 10,
    min_stock_level: 5,
    location: 'Warehouse Bay A-01',
    warehouse_id: 'wh-1',
    supplier_name: 'Ingram Micro Global Distribution'
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    sku: '',
    barcode: '',
    category_name: '',
    purchase_price: 0,
    selling_price: 0,
    quantity: 0,
    min_stock_level: 5,
    location: '',
    supplier_name: ''
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
        setWarehouses(json.data.warehouses || []);
        setStockMovements(json.data.stockMovements || []);
      } else {
        toast.error(json.message || 'Failed to load inventory data');
      }
    } catch (err) {
      toast.error(err.message || 'Network error loading catalog');
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
        toast.success(`Registered product ${json.data.sku} to catalog`);
        fetchData();
        setForm({
          name: '',
          sku: '',
          barcode: '',
          category_name: 'Enterprise Rack Servers',
          purchase_price: 320000,
          selling_price: 550000,
          quantity: 10,
          min_stock_level: 5,
          location: 'Warehouse Bay A-01',
          warehouse_id: 'wh-1',
          supplier_name: 'Ingram Micro Global Distribution'
        });
      } else {
        toast.error(json.message || 'Error registering product');
      }
    } catch (err) {
      toast.error(err.message);
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
          adjustment: adjustAmount,
          reason: adjustReason || 'Physical inventory cycle audit'
        })
      });
      const json = await res.json();
      if (json.success) {
        setIsAdjustModalOpen(false);
        toast.success(json.message || 'Stock count adjusted and ledger updated');
        fetchData();
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleTransferStock = async (e) => {
    e.preventDefault();
    if (!transferForm.product_id) {
      toast.error('Please select a product to transfer');
      return;
    }
    if (transferForm.source_warehouse_id === transferForm.target_warehouse_id) {
      toast.error('Source and destination warehouse facilities must be different');
      return;
    }
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer',
          ...transferForm
        })
      });
      const json = await res.json();
      if (json.success) {
        setIsTransferModalOpen(false);
        toast.success(json.message || 'Inter-warehouse transfer executed');
        fetchData();
      } else {
        toast.error(json.message || 'Transfer failed');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleOpenEdit = (p) => {
    setSelectedProduct(p);
    setEditForm({
      id: p.id,
      name: p.name || '',
      sku: p.sku || '',
      barcode: p.barcode || '',
      category_name: p.category_name || (categories[0]?.name || 'Enterprise Rack Servers'),
      purchase_price: Number(p.purchase_price) || 0,
      selling_price: Number(p.selling_price) || 0,
      quantity: Number(p.quantity) || 0,
      min_stock_level: Number(p.min_stock_level) || 5,
      location: p.location || '',
      supplier_name: p.supplier_name || (suppliers[0]?.name || '')
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const json = await res.json();
      if (json.success) {
        setIsEditModalOpen(false);
        toast.success('Product specifications updated');
        fetchData();
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id, currentQty) => {
    if (currentQty > 0) {
      toast.error(`Cannot delete SKU holding ${currentQty} units on hand. Adjust stock to zero first.`);
      return;
    }
    if (!confirm('Are you sure you want to retire this product SKU from the active catalog?')) return;
    try {
      const res = await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Product removed from catalog');
        fetchData();
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Filtered list based on dropdown & toggle
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category_name === selectedCategory;
    const matchesCritical = !filterCriticalOnly || Number(p.quantity) <= Number(p.min_stock_level);
    return matchesCategory && matchesCritical;
  });

  const totalCostValuation = products.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.purchase_price)), 0);
  const totalRetailValuation = products.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.selling_price)), 0);
  const criticalCount = products.filter(p => Number(p.quantity) <= Number(p.min_stock_level)).length;

  const tableColumns = [
    {
      key: 'name',
      header: 'Item Description',
      sortable: true,
      render: (p) => (
        <div>
          <div className="font-bold text-slate-900">{p.name}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
            <MapPin size={11} className="text-slate-400 shrink-0" />
            <span className="truncate">{p.location || 'Warehouse Bay A'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'sku',
      header: 'SKU & Barcode',
      sortable: true,
      width: 'w-44',
      render: (p) => (
        <div className="font-mono">
          <div className="font-bold text-blue-600">{p.sku}</div>
          <div className="text-[10px] text-slate-400">{p.barcode || '--'}</div>
        </div>
      )
    },
    {
      key: 'category_name',
      header: 'Classification',
      sortable: true,
      render: (p) => (
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
          {p.category_name}
        </span>
      )
    },
    {
      key: 'purchase_price',
      header: 'Cost / Selling (PKR)',
      sortable: true,
      align: 'right',
      render: (p) => (
        <div className="font-mono text-right">
          <div className="text-slate-400 text-[11px]">{formatCurrency(p.purchase_price)}</div>
          <div className="font-bold text-slate-900">{formatCurrency(p.selling_price)}</div>
        </div>
      )
    },
    {
      key: 'quantity',
      header: 'In Stock',
      sortable: true,
      align: 'center',
      render: (p) => {
        const isLow = Number(p.quantity) <= Number(p.min_stock_level);
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono font-bold text-xs ${
            isLow ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {p.quantity} Units
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setSelectedProduct(p);
              setAdjustAmount(0);
              setAdjustReason('');
              setIsAdjustModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            title="Stock Cycle Adjustment"
          >
            <ArrowUpDown size={15} />
          </button>
          <button
            onClick={() => handleOpenEdit(p)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            title="Edit Specifications"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => handleDelete(p.id, Number(p.quantity))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Retire Product"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )
    }
  ];

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
            Real-time SKU catalog, location bin allocations, inter-facility transfers, and immutable movement logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            onClick={fetchData}
            title="Refresh"
            className={loading ? 'animate-spin' : ''}
          />

          <Button
            variant="secondary"
            size="md"
            icon={History}
            onClick={() => setIsLedgerModalOpen(true)}
          >
            Movement History
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={ArrowRightLeft}
            onClick={() => {
              if (products.length > 0 && !transferForm.product_id) {
                setTransferForm(prev => ({ ...prev, product_id: products[0].id }));
              }
              setIsTransferModalOpen(true);
            }}
          >
            Transfer Stock
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
          >
            Register New SKU
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-1 rounded-[1.25rem] bg-slate-200/60 border border-slate-200/80 shadow-2xs">
          <div className="p-4 rounded-[1rem] bg-white border border-white/80 h-28 flex flex-col justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Active SKUs</p>
            <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{products.length}</p>
            <p className="text-[10px] text-slate-400">Across {categories.length} classifications</p>
          </div>
        </div>
        <div className="p-1 rounded-[1.25rem] bg-slate-200/60 border border-slate-200/80 shadow-2xs">
          <div className="p-4 rounded-[1rem] bg-white border border-white/80 h-28 flex flex-col justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Asset Valuation (Cost)</p>
            <p className="text-2xl font-extrabold text-blue-600 tabular-nums">{formatCurrency(totalCostValuation)}</p>
            <p className="text-[10px] text-slate-400">GAAP Account #1200 Inventory</p>
          </div>
        </div>
        <div className="p-1 rounded-[1.25rem] bg-slate-200/60 border border-slate-200/80 shadow-2xs">
          <div className="p-4 rounded-[1rem] bg-white border border-white/80 h-28 flex flex-col justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Projected Retail Value</p>
            <p className="text-2xl font-extrabold text-emerald-600 tabular-nums">{formatCurrency(totalRetailValuation)}</p>
            <p className="text-[10px] text-slate-400">~{Math.round(((totalRetailValuation - totalCostValuation) / (totalRetailValuation || 1)) * 100)}% Average Markup</p>
          </div>
        </div>
        <div className="p-1 rounded-[1.25rem] bg-slate-200/60 border border-slate-200/80 shadow-2xs">
          <div className="p-4 rounded-[1rem] bg-white border border-white/80 h-28 flex flex-col justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Low Stock Warnings</p>
            <p className={`text-2xl font-extrabold tabular-nums ${criticalCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {criticalCount} SKUs
            </p>
            <p className="text-[10px] text-slate-400">Below safety reorder threshold</p>
          </div>
        </div>
      </div>

      {/* Enterprise Reusable Table Component */}
      <EnterpriseTable
        columns={tableColumns}
        data={filteredProducts}
        searchPlaceholder="Search product description, SKU, or barcode..."
        searchKeys={['name', 'sku', 'barcode', 'category_name', 'location']}
        defaultPageSize={10}
        selectable={true}
        loading={loading}
        exportFileName={`NEXIS_Inventory_Catalog_${new Date().toISOString().slice(0, 10)}.csv`}
        filterComponent={
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-white focus:bg-white"
            >
              <option value="All">All Classifications</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            <button
              onClick={() => setFilterCriticalOnly(!filterCriticalOnly)}
              className={`h-9 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                filterCriticalOnly 
                  ? 'bg-amber-50 text-amber-700 border-amber-300' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <AlertTriangle size={13} />
              <span>Low Stock Only</span>
            </button>
          </div>
        }
      />

      {/* MODAL: Register New Product SKU */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Inventory SKU">
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Product Description</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Dell PowerEdge R750 Enterprise Server"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">SKU Identifier</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="e.g. SRV-DEL-001"
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
                placeholder="890123456789"
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
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Supplier Partner</label>
              <select
                value={form.supplier_name}
                onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              >
                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Cost Price (PKR)</label>
              <input
                type="number"
                step="1"
                value={form.purchase_price}
                onChange={(e) => setForm({ ...form, purchase_price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none font-mono focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Selling Price (PKR)</label>
              <input
                type="number"
                step="1"
                value={form.selling_price}
                onChange={(e) => setForm({ ...form, selling_price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none font-mono focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Opening Stock</label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none font-mono focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Safety Reorder Alert Level</label>
              <input
                type="number"
                value={form.min_stock_level}
                onChange={(e) => setForm({ ...form, min_stock_level: Number(e.target.value) })}
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
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
            >
              Register SKU
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Stock Cycle Adjustment */}
      <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title={`Stock Cycle Count: ${selectedProduct?.name || ''}`}>
        <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <p className="text-slate-500 font-medium">Current Stock on Hand: <span className="font-mono font-bold text-slate-900">{selectedProduct?.quantity} Units</span></p>
            <p className="text-slate-500 font-medium">SKU: <span className="font-mono font-bold text-blue-600">{selectedProduct?.sku}</span></p>
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">
              Quantity Adjustment (+ to increase, - to decrease)
            </label>
            <input
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(Number(e.target.value))}
              placeholder="e.g. 5 or -2"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none font-mono text-base font-bold focus:border-blue-600"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Resulting Stock Balance: <strong className="text-blue-600 font-mono">{Math.max(0, (selectedProduct?.quantity || 0) + adjustAmount)} Units</strong>
            </p>
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Audit Reason / Discrepancy Note</label>
            <input
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="Physical warehouse cycle count adjustment"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
            />
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
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
            >
              Commit Adjustment
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Inter-Warehouse Stock Transfer */}
      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Warehouse Stock Transfer">
        <form onSubmit={handleTransferStock} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Select Product SKU</label>
            <select
              value={transferForm.product_id}
              onChange={(e) => setTransferForm({ ...transferForm, product_id: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              required
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Available: {p.quantity} units
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Source Facility</label>
              <select
                value={transferForm.source_warehouse_id}
                onChange={(e) => setTransferForm({ ...transferForm, source_warehouse_id: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              >
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Destination Facility</label>
              <select
                value={transferForm.target_warehouse_id}
                onChange={(e) => setTransferForm({ ...transferForm, target_warehouse_id: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              >
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Transfer Quantity (Units)</label>
            <input
              type="number"
              min="1"
              value={transferForm.quantity}
              onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none font-mono focus:border-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Logistics / Dispatch Notes</label>
            <input
              type="text"
              value={transferForm.notes}
              onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
              placeholder="e.g. Scheduled freight reallocation for Q3 inventory balancing"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
            >
              Execute Stock Transfer
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Immutable Stock Movement History Ledger */}
      <Modal isOpen={isLedgerModalOpen} onClose={() => setIsLedgerModalOpen(false)} title="Immutable Stock Movement Ledger">
        <div className="space-y-3 text-xs">
          <p className="text-slate-500">
            Audit trail of all physical and operational stock events across warehouses.
          </p>

          <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-xl overflow-x-auto">
            {stockMovements.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <History size={32} className="mx-auto text-slate-300 mb-2" />
                <p>No recorded stock movements yet.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Date / Time</th>
                    <th className="py-2.5 px-3">SKU & Item</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Delta</th>
                    <th className="py-2.5 px-3 text-center">Balance</th>
                    <th className="py-2.5 px-3">Performer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {stockMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 text-slate-500 text-[11px]">
                        {mov.timestamp ? new Date(mov.timestamp).toLocaleString() : '--'}
                      </td>
                      <td className="py-2 px-3 font-sans">
                        <span className="font-mono font-bold text-blue-600">{mov.sku}</span>
                        <div className="text-[10px] text-slate-400">{mov.product_name}</div>
                      </td>
                      <td className="py-2 px-3 font-sans">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          mov.movement_type === 'PURCHASE_RECEIPT' ? 'bg-emerald-50 text-emerald-700' :
                          mov.movement_type === 'SALES_DISPATCH' ? 'bg-blue-50 text-blue-700' :
                          mov.movement_type === 'ORDER_CANCEL_RESTOCK' ? 'bg-purple-50 text-purple-700' :
                          mov.movement_type === 'WAREHOUSE_TRANSFER' ? 'bg-amber-50 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {mov.movement_type?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className={`py-2 px-3 text-right font-bold ${
                        Number(mov.quantity_change) > 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {Number(mov.quantity_change) > 0 ? `+${mov.quantity_change}` : mov.quantity_change}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-700">
                        {mov.balance_before} → <strong className="text-slate-900">{mov.balance_after}</strong>
                      </td>
                      <td className="py-2 px-3 text-slate-500 font-sans text-[11px]">
                        {mov.performed_by || 'System'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              onClick={() => setIsLedgerModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Edit Product Specifications */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Specifications: ${selectedProduct?.name || ''}`}>
        <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Product Description</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">SKU Code</label>
              <input
                type="text"
                value={editForm.sku}
                onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Barcode (EAN/UPC)</label>
              <input
                type="text"
                value={editForm.barcode}
                onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Classification</label>
              <select
                value={editForm.category_name}
                onChange={(e) => setEditForm({ ...editForm, category_name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              >
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Supplier Partner</label>
              <select
                value={editForm.supplier_name}
                onChange={(e) => setEditForm({ ...editForm, supplier_name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              >
                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Cost Price (PKR)</label>
              <input
                type="number"
                step="1"
                value={editForm.purchase_price}
                onChange={(e) => setEditForm({ ...editForm, purchase_price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none font-mono focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Selling Price (PKR)</label>
              <input
                type="number"
                step="1"
                value={editForm.selling_price}
                onChange={(e) => setEditForm({ ...editForm, selling_price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none font-mono focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Stock on Hand</label>
              <input
                type="number"
                value={editForm.quantity}
                onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none font-mono focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Safety Threshold Alert</label>
              <input
                type="number"
                value={editForm.min_stock_level}
                onChange={(e) => setEditForm({ ...editForm, min_stock_level: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none font-mono focus:border-blue-600"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Warehouse Bin / Location</label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder="Warehouse Bay A-12"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
            >
              Update SKU Record
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
