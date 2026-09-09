'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, LayoutDashboard, Package, ShoppingCart, Truck, 
  Users, Calculator, BarChart3, ShieldAlert, Settings, 
  PlusCircle, Moon, Sun, ArrowRight, UserCheck, Building2
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export default function CommandPalette({ isOpen, onClose }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { switchRole } = useAuth();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        onClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: 'dash', title: 'Executive Dashboard', subtitle: 'View real-time enterprise KPIs & trends', icon: LayoutDashboard, category: 'Navigation', run: () => router.push('/dashboard') },
    { id: 'inv', title: 'Inventory & Items', subtitle: 'Manage SKUs, stock levels, barcodes', icon: Package, category: 'Navigation', run: () => router.push('/inventory') },
    { id: 'sales', title: 'Sales Orders', subtitle: 'Customer orders, invoices, and status pipeline', icon: ShoppingCart, category: 'Navigation', run: () => router.push('/sales') },
    { id: 'purch', title: 'Procurement & Purchases', subtitle: 'Supplier purchase orders & goods receipt', icon: Truck, category: 'Navigation', run: () => router.push('/purchases') },
    { id: 'cust', title: 'Customer Directory', subtitle: 'Corporate accounts & credit limits', icon: Users, category: 'Navigation', run: () => router.push('/customers') },
    { id: 'vend', title: 'Vendor Directory', subtitle: 'Supplier directory & procurement history', icon: Building2, category: 'Navigation', run: () => router.push('/vendors') },
    { id: 'acc', title: 'Financial Accounting', subtitle: 'Chart of Accounts, Balance Sheet & P&L', icon: Calculator, category: 'Navigation', run: () => router.push('/accounting') },
    { id: 'hr', title: 'HR & Digital Attendance', subtitle: 'Employee roster, punch clock & payroll', icon: UserCheck, category: 'Navigation', run: () => router.push('/hr') },
    { id: 'bi', title: 'Operational Analytics', subtitle: 'Financial metrics & department reports', icon: BarChart3, category: 'Navigation', run: () => router.push('/analytics') },
    { id: 'audit', title: 'Audit Trail', subtitle: 'Immutable administrative action logs', icon: ShieldAlert, category: 'Navigation', run: () => router.push('/audit-logs') },
    { id: 'adm', title: 'System Settings', subtitle: 'Company profile, currency, tax rules', icon: Settings, category: 'Navigation', run: () => router.push('/admin') },
    
    // Quick Operational Actions
    { id: 'act-so', title: 'New Sales Order', subtitle: 'Draft a commercial order with line items', icon: PlusCircle, category: 'Actions', run: () => router.push('/sales') },
    { id: 'act-je', title: 'Post Journal Voucher', subtitle: 'Record balanced GAAP double-entry transaction', icon: Calculator, category: 'Actions', run: () => router.push('/accounting') },
    { id: 'act-prod', title: 'Add Inventory SKU', subtitle: 'Register a commercial product in catalog', icon: PlusCircle, category: 'Actions', run: () => router.push('/inventory') },
    { id: 'act-theme', title: `Appearance: Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, subtitle: 'Toggle application theme', icon: theme === 'dark' ? Sun : Moon, category: 'Actions', run: () => toggleTheme() },
    { id: 'role-admin', title: 'Switch Role: Super Admin', subtitle: 'Full administrative authority', icon: UserCheck, category: 'Role Switcher', run: () => switchRole('Super Admin') },
    { id: 'role-cfo', title: 'Switch Role: Financial Controller', subtitle: 'Accounting, journals & statements focus', icon: UserCheck, category: 'Role Switcher', run: () => switchRole('Financial Controller') },
    { id: 'role-hr', title: 'Switch Role: HR Director', subtitle: 'Employee directory & payroll access', icon: UserCheck, category: 'Role Switcher', run: () => switchRole('HR Director') },
    { id: 'role-inv', title: 'Switch Role: Inventory Specialist', subtitle: 'Warehouse catalog & stock replenishment', icon: UserCheck, category: 'Role Switcher', run: () => switchRole('Inventory Specialist') },
  ];

  const filtered = actions.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase()) || 
    a.subtitle.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => onClose(false)} />

      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-blue-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to module... (e.g. Sales, Accounting, Inventory)"
            className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm outline-none font-medium"
            autoFocus
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-300 rounded shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p className="font-semibold text-sm">No commands matched "{query}"</p>
              <p className="text-xs mt-1 text-slate-500">Try searching for 'Inventory', 'Sales', or 'Accounting'</p>
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.run();
                    onClose(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-600 flex items-center justify-center text-slate-600 group-hover:text-white transition-colors">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-blue-900">{item.title}</p>
                      <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {item.category}
                    </span>
                    <ArrowRight size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-blue-600 transition-opacity" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
