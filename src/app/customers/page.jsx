'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Modal from '@/components/common/Modal';
import { useToast } from '@/context/ToastContext';
import { 
  Users, Plus, Search, Mail, Phone, MapPin, 
  CreditCard, DollarSign, Loader2, RefreshCw, Download, Pencil, Trash2 
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export default function CustomersPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [form, setForm] = useState({
    name: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    credit_limit: 50000,
    status: 'Active'
  });

  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    credit_limit: 50000,
    status: 'Active'
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data || []);
      } else {
        toast.error(json.message || 'Failed to fetch customer records');
      }
    } catch (err) {
      toast.error('Network error loading customer accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        setIsAddOpen(false);
        fetchCustomers();
        toast.success(`Customer "${form.name}" registered successfully`);
        setForm({
          name: '',
          company_name: '',
          contact_person: '',
          email: '',
          phone: '',
          address: '',
          credit_limit: 50000,
          status: 'Active'
        });
      } else {
        toast.error(json.message || 'Failed to add customer');
      }
    } catch (err) {
      toast.error(err.message || 'Network error registering customer');
    }
  };

  const handleOpenEdit = (c) => {
    setSelectedCustomer(c);
    setEditForm({
      id: c.id,
      name: c.name,
      company_name: c.company_name || c.name,
      contact_person: c.contact_person || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      credit_limit: Number(c.credit_limit) || 25000,
      status: c.status || 'Active'
    });
    setIsEditOpen(true);
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const json = await res.json();
      if (json.success) {
        setIsEditOpen(false);
        fetchCustomers();
        toast.success(`Account "${editForm.name}" updated`);
      } else {
        toast.error(json.message || 'Failed to update customer');
      }
    } catch (err) {
      toast.error(err.message || 'Network error updating customer');
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove customer "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/customers?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success(`Customer "${name}" removed from accounts`);
        fetchCustomers();
      } else {
        toast.error(json.message || 'Failed to delete customer');
      }
    } catch (err) {
      toast.error(err.message || 'Network error deleting customer');
    }
  };

  const handleExportCSV = () => {
    if (customers.length === 0) {
      toast.error('No customers available to export');
      return;
    }
    const headers = ['ID', 'Trade Name', 'Company Name', 'Contact Person', 'Email', 'Phone', 'Address', 'Credit Limit', 'Total Spent', 'Current AR Balance', 'Status'];
    const rows = customers.map(c => [
      c.id,
      `"${c.name}"`,
      `"${c.company_name || c.name}"`,
      `"${c.contact_person || ''}"`,
      c.email || '',
      c.phone || '',
      `"${c.address || ''}"`,
      c.credit_limit || 0,
      c.total_spent || 0,
      c.balance || 0,
      c.status || 'Active'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Customers_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Customer directory exported to CSV');
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.company_name && c.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.contact_person && c.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalSpent = customers.reduce((s, c) => s + (Number(c.total_spent) || 0), 0);
  const totalReceivables = customers.reduce((s, c) => s + (Number(c.current_balance) || 0), 0);

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Customer Directory
            </h1>
            <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Corporate Accounts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Corporate CRM accounts, credit facilities, and active ledger balances.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCustomers}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Download Customer Sheet (CSV)"
          >
            <Download size={14} />
            <span>Download Sheet (CSV)</span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="btn-pod-blue group"
          >
            <span>Add Corporate Client</span>
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
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Corporate Clients</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{customers.length}</p>
            <p className="text-[10px] text-slate-400 mt-1">Active enterprise partners</p>
          </div>
        </div>
        <div className="double-bezel">
          <div className="double-bezel-inner">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Lifetime Gross Spend</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">{formatCurrency(totalSpent)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Cumulative settled invoices</p>
          </div>
        </div>
        <div className="double-bezel">
          <div className="double-bezel-inner">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Receivables Outstanding</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-1 tabular-nums">{formatCurrency(totalReceivables)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Net-30 open receivables</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="double-bezel">
        <div className="double-bezel-inner !p-2.5">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers by company name or representative..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Customer Directory Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-bold text-slate-500">Loading client registry...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Users size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-sm text-slate-700">No corporate clients found</p>
          <p className="text-xs text-slate-500 mt-1">Try clearing filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <div key={client.id} className="double-bezel">
              <div className="double-bezel-inner h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{client.company_name || client.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">Rep: {client.contact_person || client.name}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                      {client.status || 'Active'}
                    </span>
                  </div>

                  <div className="py-3 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-slate-400" />
                      <span>{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400" />
                      <span>{client.phone || '+1 (800) 555-0100'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-slate-400" />
                      <span className="truncate">{client.address || 'Corporate Facility'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-[10px] font-bold uppercase text-slate-500">Credit Limit</p>
                      <p className="font-mono font-bold text-slate-900 mt-0.5 tabular-nums">{formatCurrency(client.credit_limit || 0)}</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-[10px] font-bold uppercase text-slate-500">AR Balance</p>
                      <p className="font-mono font-bold text-blue-600 mt-0.5 tabular-nums">{formatCurrency(client.current_balance || 0)}</p>
                    </div>
                  </div>

                  {/* Action Buttons: Edit & Delete */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Spent: {formatCurrency(client.total_spent || 0)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(client)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-colors"
                        title="Edit Customer"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(client.id, client.company_name || client.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors"
                        title="Delete Customer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Customer */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Corporate Client">
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Entity / Trade Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Apex Logistics"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Legal Company Name</label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                placeholder="Apex Logistics International Corp"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Key Contact Person</label>
              <input
                type="text"
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                placeholder="David Vance"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Corporate Billing Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="billing@apexlogistics.com"
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
                placeholder="+1 (212) 555-0199"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Authorized Credit Limit (PKR)</label>
              <input
                type="number"
                value={form.credit_limit}
                onChange={(e) => setForm({ ...form, credit_limit: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Corporate Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="1200 Harbor Boulevard, Weehawken, NJ 07086"
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
              Enroll Client
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Customer */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Corporate Client">
        <form onSubmit={handleUpdateCustomer} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Entity / Trade Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Legal Company Name</label>
              <input
                type="text"
                value={editForm.company_name}
                onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Key Contact Person</label>
              <input
                type="text"
                value={editForm.contact_person}
                onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Corporate Billing Email</label>
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
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Authorized Credit Limit (PKR)</label>
              <input
                type="number"
                value={editForm.credit_limit}
                onChange={(e) => setEditForm({ ...editForm, credit_limit: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Account Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-semibold"
              >
                <option value="Active">Active</option>
                <option value="Credit Hold">Credit Hold</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Corporate Address</label>
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
