'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Modal from '@/components/common/Modal';
import { 
  Building2, Plus, Search, Mail, Phone, MapPin, 
  Star, Truck, Loader2, RefreshCw, Download, Pencil, Trash2 
} from 'lucide-react';

export default function VendorsPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    category: 'Enterprise Hardware & Security',
    rating: 4.8,
    status: 'Active'
  });

  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    rating: 4.8,
    status: 'Active'
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendors');
      const json = await res.json();
      if (json.success) setSuppliers(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        setIsAddOpen(false);
        fetchSuppliers();
        setForm({
          name: '',
          contact_person: '',
          email: '',
          phone: '',
          address: '',
          category: 'Enterprise Hardware & Security',
          rating: 4.8,
          status: 'Active'
        });
      } else {
        alert(json.message);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEdit = (sup) => {
    setSelectedVendor(sup);
    setEditForm({
      id: sup.id,
      name: sup.name,
      contact_person: sup.contact_person || '',
      email: sup.email || '',
      phone: sup.phone || '',
      address: sup.address || '',
      category: sup.category || 'Enterprise Hardware & Security',
      rating: sup.rating || 4.8,
      status: sup.status || 'Active'
    });
    setIsEditOpen(true);
  };

  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vendors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const json = await res.json();
      if (json.success) {
        setIsEditOpen(false);
        fetchSuppliers();
      } else {
        alert(json.message);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSupplier = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete vendor "${name}"? This action will remove the supplier from procurement directories.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/vendors?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchSuppliers();
      } else {
        alert(json.message);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExportCSV = () => {
    if (suppliers.length === 0) return alert('No vendors to export');
    const headers = ['ID', 'Company Name', 'Category', 'Contact Person', 'Email', 'Phone', 'Address', 'Rating', 'Status', 'POs Fulfilled'];
    const rows = suppliers.map(s => [
      s.id,
      `"${s.name}"`,
      `"${s.category}"`,
      `"${s.contact_person || ''}"`,
      s.email || '',
      s.phone || '',
      `"${s.address || ''}"`,
      s.rating || 0,
      s.status || 'Active',
      s.total_orders || 0
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vendors_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Vendors & Supply Channels
            </h1>
            <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Procurement Partners
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supplier compliance, verified quality ratings, and manufacturer channel directories.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchSuppliers}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Download Vendors Sheet (CSV)"
          >
            <Download size={14} />
            <span>Download Sheet (CSV)</span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="btn-pod-blue group"
          >
            <span>Onboard New Supplier</span>
            <span className="pod-icon">
              <Plus size={13} className="text-white" />
            </span>
          </button>
        </div>
      </div>

      {/* Metrics Banner with Double-Bezel Architecture */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="double-bezel">
          <div className="double-bezel-inner">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Qualified Vendors</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{suppliers.length}</p>
            <p className="text-[10px] text-slate-400 mt-1">Approved commercial accounts</p>
          </div>
        </div>
        <div className="double-bezel">
          <div className="double-bezel-inner">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Average Quality Rating</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-1 tabular-nums">4.8 / 5.0</p>
            <p className="text-[10px] text-slate-400 mt-1">Based on on-time delivery & SLA</p>
          </div>
        </div>
        <div className="double-bezel">
          <div className="double-bezel-inner">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Preferred Distributors</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">
              {suppliers.filter(s => s.status === 'Preferred Vendor').length}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Direct Tier-1 supply agreements</p>
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="double-bezel">
        <div className="double-bezel-inner !p-2.5">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search suppliers by name, category, or representative..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Suppliers Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-bold text-slate-500">Loading supplier network...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Building2 size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-sm text-slate-700">No suppliers found</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sup) => (
            <div key={sup.id} className="double-bezel">
              <div className="double-bezel-inner h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{sup.name}</h3>
                      <p className="text-xs text-blue-600 font-semibold">{sup.category}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      sup.status === 'Preferred Vendor' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {sup.status || 'Active'}
                    </span>
                  </div>

                  <div className="py-3 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-semibold">Rep:</span>
                      <span className="font-medium text-slate-800">{sup.contact_person || 'Commercial Agent'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-slate-400" />
                      <span>{sup.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400" />
                      <span>{sup.phone || '+1 (800) 555-0199'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-slate-400" />
                      <span className="truncate">{sup.address || 'Corporate Headquarters'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star size={13} className="fill-amber-400" />
                    <span>{sup.rating || 4.8} Rating</span>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(sup)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-colors"
                      title="Edit Vendor Details"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(sup.id, sup.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors"
                      title="Delete Vendor"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Supplier */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Onboard Supplier Partner">
        <form onSubmit={handleCreateSupplier} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Supplier Company Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ingram Micro Global Distribution"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Contact Representative</label>
              <input
                type="text"
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                placeholder="e.g. Arthur Pendelton"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Corporate Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="supply@vendor.com"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Phone Number</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (800) 555-0199"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Classification Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              >
                <option value="Enterprise Hardware & Security">Enterprise Hardware & Security</option>
                <option value="Networking & Telecom Infrastructure">Networking & Telecom Infrastructure</option>
                <option value="Power, Cooling & Rack Enclosures">Power, Cooling & Rack Enclosures</option>
                <option value="Cabling & Structural Connectivity">Cabling & Structural Connectivity</option>
                <option value="General Commercial Supplies">General Commercial Supplies</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Physical Address / Headquarters</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="3351 Michelson Drive, Suite 100, Irvine, CA 92612"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs"
            >
              Enroll Vendor
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Supplier */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Vendor Details">
        <form onSubmit={handleUpdateSupplier} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Supplier Company Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Contact Representative</label>
              <input
                type="text"
                value={editForm.contact_person}
                onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Corporate Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Phone Number</label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Classification Category</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              >
                <option value="Enterprise Hardware & Security">Enterprise Hardware & Security</option>
                <option value="Networking & Telecom Infrastructure">Networking & Telecom Infrastructure</option>
                <option value="Power, Cooling & Rack Enclosures">Power, Cooling & Rack Enclosures</option>
                <option value="Cabling & Structural Connectivity">Cabling & Structural Connectivity</option>
                <option value="General Commercial Supplies">General Commercial Supplies</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Account Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-semibold"
              >
                <option value="Active">Active</option>
                <option value="Preferred Vendor">Preferred Vendor</option>
                <option value="Under Review">Under Review</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Quality Rating (1.0 to 5.0)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={editForm.rating}
                onChange={(e) => setEditForm({ ...editForm, rating: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Physical Address / Headquarters</label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
