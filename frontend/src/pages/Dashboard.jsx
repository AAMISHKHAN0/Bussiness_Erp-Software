import { useQuery } from '@tanstack/react-query';
import {
    DollarSign, ShoppingCart, Package, Users, TrendingUp,
    TrendingDown, AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import SalesChart from '../components/dashboard/SalesChart';
import RevenueChart from '../components/dashboard/RevenueChart';
import DigitalClock from '../components/dashboard/DigitalClock';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { formatCurrency } from '../utils/formatters';

const Dashboard = () => {
    const { isAuthenticated } = useAuth();
    const { t } = useI18n();

    // Real-time data fetching
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        enabled: isAuthenticated,
        queryFn: async () => {
            const res = await api.get('/reports/dashboard-stats');
            return res.data.data;
        },
        refetchInterval: 30000,
        refetchOnWindowFocus: true,
    });

    const { data: recentOrders, isLoading: ordersLoading } = useQuery({
        queryKey: ['recent-orders'],
        enabled: isAuthenticated,
        queryFn: async () => {
            const res = await api.get('/sales/orders');
            return res.data.data.slice(0, 5);
        },
        refetchInterval: 30000,
        refetchOnWindowFocus: true,
    });

    const statusColors = {
        Completed: 'bg-emerald-100 text-emerald-700',
        Processing: 'bg-blue-100 text-blue-700',
        Pending: 'bg-amber-100 text-amber-700',
    };

    const getStatStyle = (title) => {
        switch (title) {
            case 'Total Revenue': return { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'hover:border-emerald-200', label: t('stats.totalRevenue') };
            case 'Total Sales': return { icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50', border: 'hover:border-blue-200', label: t('stats.totalSales') };
            case 'Products': return { icon: Package, color: 'text-violet-600', bg: 'bg-violet-50', border: 'hover:border-violet-200', label: t('stats.products') };
            case 'Employees': return { icon: Users, color: 'text-amber-600', bg: 'bg-amber-50', border: 'hover:border-amber-200', label: t('stats.employees') };
            case 'Critical Stock': return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'hover:border-red-200', label: t('stats.criticalStock') };
            default: return { icon: Package, color: 'text-gray-600', bg: 'bg-gray-50', border: 'hover:border-gray-200', label: title };
        }
    };

    return (
        <div className="page-shell page-stack">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('dashboard.title')}</h1>
                    <p className="page-subtitle">{t('dashboard.subtitle')}</p>
                </div>
                <DigitalClock />
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {statsLoading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 rounded-[var(--radius-panel)] bg-gray-100 animate-pulse" />
                    ))
                ) : (
                    stats?.map((card) => {
                        const style = getStatStyle(card.title);
                        const Icon = style.icon;
                        return (
                            <div key={card.title} className={`panel-card group transition-all duration-300 ${style.border}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="metric-label text-gray-400 font-bold uppercase tracking-widest">{style.label}</p>
                                        <h3 className="metric-value mt-2 font-black text-gray-900 tabular-nums">
                                            {card.isCurrency ? formatCurrency(card.value) : card.value.toLocaleString()}
                                        </h3>
                                    </div>
                                    <div className={`rounded-2xl p-3.5 ${style.bg} ${style.color} transition-transform duration-300 group-hover:scale-110`}>
                                        <Icon size={24} />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${card.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : card.trend === 'down' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                                        {card.trend === 'up' ? <TrendingUp size={12} /> : card.trend === 'down' ? <TrendingDown size={12} /> : null}
                                        {card.change}
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{t('common.current')}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="panel-card h-[320px] sm:h-[400px]">
                    <SalesChart />
                </div>
                <div className="panel-card h-[320px] sm:h-[400px]">
                    <RevenueChart />
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Stock Alerts */}
                <div className="panel-card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">{t('dashboard.criticalStock')}</h3>
                        <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {stats && stats.find(s => s.title === 'Critical Stock')?.details?.length > 0 ? (
                            stats.find(s => s.title === 'Critical Stock').details.map((item, i) => (
                                <div key={i} className="border-b border-gray-50 pb-3 last:border-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-gray-800">{item.name}</span>
                                         <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                            {item.quantity} {t('dashboard.left')}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-red-500 h-full rounded-full"
                                            style={{ width: `${Math.max(0, Math.min(100, (item.quantity / Math.max(item.min_stock_level || 1, 1)) * 100))}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-gray-400 text-sm">{t('dashboard.noAlerts')}</div>
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="panel-card lg:col-span-2 !p-0 overflow-hidden">
                    <div className="p-6 border-b border-gray-50">
                        <h3 className="text-lg font-bold text-gray-900">{t('dashboard.recentTransactions')}</h3>
                    </div>
                    <div className="table-shell">
                        <table className="min-w-[560px] w-full text-left whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">{t('dashboard.orderId')}</th>
                                    <th className="px-6 py-4">{t('dashboard.customer')}</th>
                                    <th className="px-6 py-4">{t('dashboard.amount')}</th>
                                    <th className="px-6 py-4">{t('dashboard.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {ordersLoading ? (
                                    <tr><td colSpan="4" className="p-6 text-center text-gray-400">Loading...</td></tr>
                                ) : (
                                    recentOrders?.length > 0 ? recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-blue-600">{order.order_number}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{order.customer_name || t('dashboard.guest')}</td>
                                            <td className="px-6 py-4 text-sm font-bold">{formatCurrency(order.total_amount)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center">
                                                <ShoppingCart className="mx-auto text-gray-300 mb-2" size={32} />
                                                <p className="text-gray-400 text-sm">{t('dashboard.noTransactions')}</p>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
