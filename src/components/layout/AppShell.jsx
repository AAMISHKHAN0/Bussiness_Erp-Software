'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Package, ShoppingCart, Truck, Users, 
  Calculator, BarChart3, ShieldAlert, Settings, Menu, X, 
  Search, Bell, Sun, Moon, ChevronDown, 
  LogOut, UserCheck, Building2, ChevronRight,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import CommandPalette from '@/components/common/CommandPalette';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory & Items', href: '/inventory', icon: Package, badge: 'Stock' },
  { name: 'Sales Orders', href: '/sales', icon: ShoppingCart },
  { name: 'Procurement', href: '/purchases', icon: Truck },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Vendors', href: '/vendors', icon: Building2 },
  { name: 'Accounting', href: '/accounting', icon: Calculator, badge: 'GAAP' },
  { name: 'HR & Payroll', href: '/hr', icon: UserCheck },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Audit Logs', href: '/audit-logs', icon: ShieldAlert },
  { name: 'System Settings', href: '/admin', icon: Settings },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, switchRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Restore minimized sidebar state from localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('erp_sidebar_collapsed');
      if (savedState !== null) {
        setSidebarCollapsed(savedState === 'true');
      }
    } catch (e) {}
  }, []);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('erp_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  // If user is on /login, render without shell
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const currentNav = NAV_ITEMS.find(item => pathname.startsWith(item.href)) || NAV_ITEMS[0];

  const handleRoleSelect = (roleName) => {
    switchRole(roleName);
    setRoleDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Command Palette */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={setCommandPaletteOpen} />

      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)} 
        />
      )}

      {/* Sidebar (Collapsible) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out lg:static shadow-sm ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand / Logo Header */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-200 bg-white">
          <Link 
            href="/dashboard" 
            className={`flex items-center gap-3 overflow-hidden ${sidebarCollapsed ? 'justify-center w-full' : ''}`}
            title="Global Enterprise ERP Suite"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-black text-lg text-white shadow-sm flex-shrink-0">
              G
            </div>
            {!sidebarCollapsed && (
              <div className="leading-tight overflow-hidden">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 block truncate">Global ERP</span>
                <span className="text-[11px] font-semibold text-blue-600 tracking-normal block truncate">Enterprise Suite</span>
              </div>
            )}
          </Link>

          {/* Minimize toggle inside sidebar */}
          <button 
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Minimize Sidebar (Ctrl+B)"
            >
              <PanelLeftClose size={17} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center rounded-lg text-sm transition-colors group relative ${
                  sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3.5 py-2.5'
                } ${
                  isActive 
                    ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                }`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon size={19} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600 transition-colors flex-shrink-0'} />
                {!sidebarCollapsed && (
                  <span className="flex-1 whitespace-nowrap truncate">{item.name}</span>
                )}
                {!sidebarCollapsed && item.badge && !isActive && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Current Active Role Badge & Collapse Button Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          {!sidebarCollapsed ? (
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between shadow-2xs">
              <div className="overflow-hidden pr-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department Portal</p>
                <p className="text-xs font-bold text-slate-900 truncate">{user?.role || 'Super Admin'}</p>
              </div>
              <button
                onClick={toggleSidebar}
                className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-800 rounded-md hover:bg-slate-100 transition-colors flex-shrink-0"
                title="Minimize Sidebar (Ctrl+B)"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={toggleSidebar}
                className="text-slate-500 hover:text-blue-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="Expand Sidebar (Ctrl+B)"
              >
                <PanelLeftOpen size={19} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between z-30 shadow-2xs">
          {/* Left: Mobile menu toggle + Desktop sidebar toggle + breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>

            {/* Desktop Minimize/Expand Toggle Button in Header */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title={sidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Minimize Sidebar (Ctrl+B)"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="text-slate-600">Enterprise Operations</span>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="font-bold text-slate-900">{currentNav.name}</span>
            </div>
          </div>

          {/* Center: Command Palette Trigger Button */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-500 text-xs font-medium transition-colors group"
            >
              <span className="flex items-center gap-2">
                <Search size={14} className="text-blue-600" />
                <span>Search modules, accounts, items...</span>
              </span>
              <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-mono text-slate-600 shadow-2xs">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Quick Command Trigger on mobile */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              title="Search"
            >
              <Search size={18} />
            </button>

            {/* Dark/Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-bold text-slate-800">
                    <span>Operational Alerts</span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-200">3 Alerts</span>
                  </div>
                  <div className="py-2 space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="font-bold text-slate-900">Inventory Notice: APC Metered PDU</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">6 units remaining in Warehouse Bay C-02.</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="font-bold text-slate-900">Order Shipped: SO-2026-0892</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">Dispatched to Apex Logistics International.</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="font-bold text-slate-900">ACH Settlement: $36,661.25</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">Remittance posted from Morgan & Sterling.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Department Role Switcher & User Profile */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pl-2 rounded-lg bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-left transition-colors"
              >
                <div className="w-7 h-7 rounded-md overflow-hidden bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                  {user?.first_name ? user.first_name[0] : 'A'}
                </div>
                <div className="hidden sm:block leading-tight">
                  <p className="text-xs font-bold text-slate-900">{user?.first_name} {user?.last_name}</p>
                  <p className="text-[10px] text-blue-600 font-semibold">{user?.role}</p>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2.5 pb-2 border-b border-slate-200">
                    <p className="font-bold text-slate-900">{user?.first_name} {user?.last_name}</p>
                    <p className="text-[11px] text-slate-500">{user?.email}</p>
                    <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase tracking-wider">Active: {user?.role}</p>
                  </div>

                  <div className="py-2">
                    <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Department Portal Switcher
                    </p>
                    {['Super Admin', 'Financial Controller', 'HR Director', 'Inventory Specialist', 'Senior Sales Representative'].map((role) => (
                      <button
                        key={role}
                        onClick={() => handleRoleSelect(role)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-between ${
                          user?.role === role 
                            ? 'bg-blue-50 text-blue-700 font-bold' 
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{role}</span>
                        {user?.role === role && <UserCheck size={13} className="text-blue-600" />}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold transition-colors"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Body Container */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
