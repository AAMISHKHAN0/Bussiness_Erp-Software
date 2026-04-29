import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, AlertTriangle, PackageCheck, TrendingUp, Info, X, Check } from 'lucide-react';
import api from '../../services/api';

const NotificationCenter = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [dismissed, setDismissed] = useState(new Set());
    const panelRef = useRef(null);

    // Fetch dashboard stats for low-stock alerts
    const { data: statsData } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => api.get('/reports/dashboard-stats').then(res => res.data.data),
    });

    // Build notifications from system state
    const notifications = [];

    // Low-stock alerts
    if (statsData?.critical_stock && Array.isArray(statsData.critical_stock)) {
        statsData.critical_stock.forEach((item, i) => {
            notifications.push({
                id: `low-stock-${i}`,
                type: 'warning',
                icon: AlertTriangle,
                title: `Low Stock: ${item.name}`,
                message: `Only ${item.quantity} units remaining (min: ${item.min_stock_level})`,
                time: 'Now',
            });
        });
    }

    // System notifications
    notifications.push({
        id: 'welcome',
        type: 'info',
        icon: Info,
        title: 'System Online',
        message: 'All ERP modules are operational and connected.',
        time: 'System',
    });

    if (statsData?.total_sales > 0) {
        notifications.push({
            id: 'sales-active',
            type: 'success',
            icon: TrendingUp,
            title: 'Sales Activity',
            message: `${statsData.total_sales} active sales orders in the system.`,
            time: 'Today',
        });
    }

    if (statsData?.total_products > 0) {
        notifications.push({
            id: 'products-ready',
            type: 'success',
            icon: PackageCheck,
            title: 'Inventory Loaded',
            message: `${statsData.total_products} products catalogued and ready.`,
            time: 'Today',
        });
    }

    const activeNotifications = notifications.filter(n => !dismissed.has(n.id));
    const unreadCount = activeNotifications.length;

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleDismiss = (id) => {
        setDismissed(prev => new Set([...prev, id]));
    };

    const handleDismissAll = () => {
        setDismissed(new Set(notifications.map(n => n.id)));
    };

    const typeColors = {
        warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', dot: 'bg-amber-500' },
        success: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', dot: 'bg-emerald-500' },
        info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', dot: 'bg-blue-500' },
        error: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500', dot: 'bg-red-500' },
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/30">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200/80 z-50 overflow-hidden animate-slideDown">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{unreadCount} active</p>
                        </div>
                        {unreadCount > 0 && (
                            <button onClick={handleDismissAll} className="text-[10px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 uppercase tracking-widest">
                                <Check size={12} /> Clear All
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {activeNotifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-400 font-medium">All caught up!</p>
                                <p className="text-xs text-gray-300 mt-1">No pending notifications.</p>
                            </div>
                        ) : (
                            activeNotifications.map(notification => {
                                const colors = typeColors[notification.type] || typeColors.info;
                                const Icon = notification.icon;
                                return (
                                    <div key={notification.id} className={`px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50/50 transition-colors group`}>
                                        <div className="flex gap-3">
                                            <div className={`w-9 h-9 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                                                <Icon size={16} className={colors.icon} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-sm font-semibold text-gray-900 leading-tight">{notification.title}</p>
                                                    <button onClick={() => handleDismiss(notification.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all flex-shrink-0">
                                                        <X size={12} className="text-gray-400" />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notification.message}</p>
                                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1.5 inline-block">{notification.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
