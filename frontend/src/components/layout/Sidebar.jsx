import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Truck,
    Calculator,
    Users,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    HardDrive,
    UserCircle,
    Factory,
    TrendingUp,
    History,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useState, useEffect } from 'react';

const navigation = [
    { labelKey: 'sidebar.dashboard', to: '/dashboard', icon: LayoutDashboard, permission: 'view_dashboard' },
    { labelKey: 'sidebar.inventory', to: '/inventory', icon: Package, permission: 'view_inventory' },
    { labelKey: 'sidebar.sales', to: '/sales', icon: ShoppingCart, permission: 'view_sales' },
    { labelKey: 'sidebar.purchases', to: '/purchases', icon: Truck, permission: 'view_purchases' },
    { labelKey: 'sidebar.customers', to: '/customers', icon: UserCircle, permission: 'view_sales' },
    { labelKey: 'sidebar.vendors', to: '/vendors', icon: Factory, permission: 'view_purchases' },
    { labelKey: 'sidebar.accounting', to: '/accounting', icon: Calculator, permission: 'view_accounting' },
    { labelKey: 'sidebar.analytics', to: '/analytics', icon: TrendingUp, permission: 'view_reports' },
    { labelKey: 'sidebar.hr', to: '/hr', icon: Users, permission: 'view_hr' },
    { labelKey: 'sidebar.reports', to: '/reports', icon: BarChart3, permission: 'view_reports' },
    { labelKey: 'sidebar.auditLogs', to: '/audit-logs', icon: History, permission: 'manage_users' },
    { labelKey: 'sidebar.mediaManager', to: '/media', icon: HardDrive, permission: 'view_media' },
    { labelKey: 'sidebar.admin', to: '/admin', icon: Settings, permission: 'manage_users' },
];

const Sidebar = ({ isOpen, onToggle }) => {
    const { user } = useAuth();
    const { t } = useI18n();
    const [logoUrl, setLogoUrl] = useState(null);

    // Load logo from localStorage
    useEffect(() => {
        const savedLogo = localStorage.getItem('erp_logo');
        if (savedLogo) {
            setLogoUrl(savedLogo);
        } else {
            setLogoUrl('/logo.png');
        }
    }, []);

    const hasAccess = (permission) => {
        if (!permission) return true;
        if (user?.role === 'Super Admin') return true;
        if (user?.permissions?.includes('*')) return true;
        return user?.permissions?.includes(permission);
    };

    const filteredNavigation = navigation.filter(item => hasAccess(item.permission));

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 lg:hidden"
                    style={{
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                    }}
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 flex h-[100dvh] flex-col overflow-x-hidden border-r border-white/5 bg-sidebar shadow-2xl transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 lg:self-start lg:shadow-none ${
                    isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:w-20'
                }`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20 overflow-hidden">
                            {logoUrl ? (
                                <img src={logoUrl} alt="ERP Logo" className="w-full h-full object-cover rounded-lg shadow-inner" />
                            ) : (
                                <span className="text-white font-bold text-sm">ERP</span>
                            )}
                        </div>
                        {isOpen && (
                            <span className="text-white font-bold text-lg tracking-tight whitespace-nowrap">
                                ERP System
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onToggle}
                        className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-white hover:bg-sidebar-hover transition-colors"
                    >
                        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="mt-6 flex-1 overflow-y-auto px-3 pb-24 space-y-1 custom-scrollbar">
                    {filteredNavigation.map((item) => {
                        const Icon = item.icon;
                        const label = t(item.labelKey);
                        return (
                            <NavLink
                                key={item.labelKey}
                                to={item.to}
                                onClick={() => {
                                    if (window.innerWidth < 1024 && isOpen) {
                                        onToggle();
                                    }
                                }}
                                className={({ isActive }) =>
                                    `sidebar-link ${isActive ? 'active' : ''} ${!isOpen ? 'lg:justify-center lg:px-2' : ''}`
                                }
                                title={!isOpen ? label : undefined}
                            >
                                <Icon size={20} className="flex-shrink-0" />
                                {isOpen && (
                                    <span className="whitespace-nowrap">{label}</span>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Version badge */}
                {isOpen && (
                    <div className="absolute bottom-4 left-0 right-0 px-4">
                        <div className="text-center text-xs text-gray-600">
                            v2.0.0 · Enterprise
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
};

export default Sidebar;
