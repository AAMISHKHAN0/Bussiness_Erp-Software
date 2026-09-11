'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Modal from '@/components/common/Modal';
import { useToast } from '@/context/ToastContext';
import { 
  Users, UserPlus, Shield, ShieldCheck, CheckCircle2, 
  XCircle, AlertTriangle, RefreshCw, Key, Building2, 
  Lock, Edit3, Power, UserCheck, Trash2
} from 'lucide-react';

export default function UsersPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Add User Form
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'Cashier',
    branch_id: 'b-1',
    is_active: true
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error(json.message || 'Failed to load organization members');
      }
    } catch (err) {
      toast.error('Network error loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const users = data?.users || [];
  const roles = data?.roles || ['Administrator', 'Manager', 'Accountant', 'Cashier'];
  const branches = data?.branches || [];
  const seatInfo = data?.seatInfo || { currentActive: 0, maxUsers: 4, availableSeats: 0, isLimitReached: false };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        setIsAddModalOpen(false);
        fetchUsers();
        toast.success(json.message || 'User created successfully');
        setForm({ first_name: '', last_name: '', email: '', password: '', role: 'Cashier', branch_id: 'b-1', is_active: true });
      } else {
        toast.error(json.message || 'Failed to create user');
      }
    } catch (err) {
      toast.error(err.message || 'Error creating user');
    }
  };

  const handleDeleteUser = async (u) => {
    if (!confirm(`Are you sure you want to delete user ${u.full_name || u.email}? This will release their allocated seat.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/users?id=${u.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'User deleted');
        fetchUsers();
      } else {
        toast.error(json.message || 'Failed to delete user');
      }
    } catch (err) {
      toast.error('Network error deleting user');
    }
  };

  const handleToggleStatus = async (user) => {
    const nextState = !user.is_active;
    if (nextState && seatInfo.isLimitReached) {
      toast.error(`Cannot activate user: Active seat quota of ${seatInfo.maxUsers} is currently full.`);
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-status',
          user_id: user.id,
          is_active: nextState
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        fetchUsers();
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error('Error updating user status');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          user_id: selectedUser.id,
          first_name: selectedUser.first_name,
          last_name: selectedUser.last_name,
          role: selectedUser.role,
          branch_id: selectedUser.branch_id,
          password: selectedUser.new_password ? selectedUser.new_password.trim() : undefined
        })
      });
      const json = await res.json();
      if (json.success) {
        setIsEditModalOpen(false);
        toast.success('User profile updated successfully');
        fetchUsers();
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error('Error updating user');
    }
  };

  const quotaPercent = Math.min(100, Math.round((seatInfo.currentActive / seatInfo.maxUsers) * 100));

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              User Management & Access Control
            </h1>
            <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Role-Based Access (RBAC)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage organization team members, assign granular security roles, and monitor enterprise user seat allocation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors shadow-2xs"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
          
          <button
            onClick={() => {
              setForm(prev => ({ ...prev, is_active: !seatInfo.isLimitReached }));
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <UserPlus size={14} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Organization Active Seat Quota Banner */}
      <div className="double-bezel">
        <div className="double-bezel-inner !p-5 bg-gradient-to-r from-blue-50/70 via-slate-50 to-indigo-50/70 border border-blue-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                  Enterprise User Seat Quota
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-600 text-white font-mono">
                  maxUsers = {seatInfo.maxUsers}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                This organization is configured with a backend-enforced limit of <span className="font-bold text-slate-900">{seatInfo.maxUsers} active users</span>.
                Attempting to register a 5th active user will trigger a business policy rejection.
              </p>
            </div>

            <div className="flex items-center gap-4 min-w-[240px]">
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">
                    {seatInfo.currentActive} of {seatInfo.maxUsers} Active Seats Used
                  </span>
                  <span className={seatInfo.availableSeats === 0 ? 'text-rose-600' : 'text-emerald-600'}>
                    {seatInfo.availableSeats} Available
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      quotaPercent >= 100 ? 'bg-rose-500' : quotaPercent >= 75 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${quotaPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Roster Table */}
      <div className="double-bezel">
        <div className="double-bezel-inner !p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Registered Organization Members</h3>
              <p className="text-xs text-slate-500">Active and disabled member accounts</p>
            </div>
            <span className="text-xs font-mono text-slate-500 font-bold">
              {users.length} Total Registered Accounts
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Security Role</th>
                <th className="py-3 px-4">Assigned Branch</th>
                <th className="py-3 px-4 text-center">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                        {u.first_name ? u.first_name[0].toUpperCase() : u.email[0].toUpperCase()}
                      </div>
                      <span>{u.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      u.role === 'Administrator' || u.role === 'Super Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      u.role === 'Manager' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      u.role === 'Accountant' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {branches.find(b => b.id === u.branch_id)?.name || u.branch_id || 'Main Branch'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.is_active 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}>
                      {u.is_active ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      <span>{u.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => { setSelectedUser({ ...u, new_password: '' }); setIsEditModalOpen(true); }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Edit User Profile"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                          u.is_active
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {u.is_active ? 'Disable' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add User */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Organization Member">
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div className={`p-3 rounded-lg text-xs ${
            seatInfo.isLimitReached 
              ? 'bg-amber-50 border border-amber-200 text-amber-800' 
              : 'bg-blue-50 border border-blue-200 text-blue-900'
          }`}>
            <p className="font-bold">
              {seatInfo.isLimitReached ? 'Active Seat Quota Full (4/4 Active)' : 'Active Seat Allocation'}
            </p>
            <p className="text-[11px] mt-0.5">
              {seatInfo.isLimitReached 
                ? 'All 4 active seats are currently in use. You can create this staff member as Inactive (Draft), or deactivate an existing user first.' 
                : `Available seats: ${seatInfo.availableSeats} of ${seatInfo.maxUsers}. Creating an active user will consume 1 seat.`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">First Name</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="First name"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Last Name</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder="Last name"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Corporate Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="member@company.com"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-mono"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Initial Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Role Assignment</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-bold"
              >
                <option value="Administrator">Administrator (Full Enterprise Access)</option>
                <option value="Manager">Manager (Operations & Reporting)</option>
                <option value="Accountant">Accountant (General Ledger & Finance)</option>
                <option value="Cashier">Cashier (POS Counter & Sales Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Branch Allocation</label>
              <select
                value={form.branch_id}
                onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
              >
                <option value="b-1">Main Corporate Branch (Lahore)</option>
                <option value="b-2">Karachi Regional Distribution Center</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Account Activation Status</label>
              <select
                value={form.is_active ? 'active' : 'inactive'}
                onChange={(e) => setForm({ ...form, is_active: e.target.value === 'active' })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-bold"
              >
                <option value="active" disabled={seatInfo.isLimitReached}>
                  Active Member {seatInfo.isLimitReached ? '(Seat quota full)' : '(Consumes 1 Active Seat)'}
                </option>
                <option value="inactive">Inactive / Draft (Does not consume seat)</option>
              </select>
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
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit User */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Member Profile">
        {selectedUser && (
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">First Name</label>
                <input
                  type="text"
                  value={selectedUser.first_name || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, first_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Last Name</label>
                <input
                  type="text"
                  value={selectedUser.last_name || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, last_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">Security Role</label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-blue-600 font-bold"
                >
                  <option value="Administrator">Administrator (Full Enterprise Access)</option>
                  <option value="Manager">Manager (Operations & Oversight)</option>
                  <option value="Accountant">Accountant (General Ledger & Finance)</option>
                  <option value="Cashier">Cashier (POS Counter & Billing)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold uppercase text-[10px] mb-1">
                  Reset Password (Optional)
                </label>
                <input
                  type="password"
                  value={selectedUser.new_password || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, new_password: e.target.value })}
                  placeholder="Enter new password (leave blank to keep current)"
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
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>
    </AppShell>
  );
}
