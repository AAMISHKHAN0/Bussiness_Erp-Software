import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useI18n } from '../../context/I18nContext';

const RevenueChart = () => {
    const { locale, t } = useI18n();

    const { data: chartData, isLoading } = useQuery({
        queryKey: ['dashboard-timeseries', locale],
        queryFn: async () => {
            const res = await api.get('/reports/dashboard-timeseries');
            return (res.data.data || []).map((item) => {
                const date = new Date(item.month_start);
                return {
                    name: new Intl.DateTimeFormat(locale, { month: 'short' }).format(date),
                    revenue: Number(item.revenue) || 0,
                    expenses: Number(item.expenses) || 0,
                };
            });
        },
        refetchInterval: 10000, // 10 seconds for more real-time feel
        refetchOnWindowFocus: true,
        staleTime: 5000, // Consider data stale after 5 seconds
        gcTime: 60000, // Keep in cache for 1 minute
    });

    if (isLoading) return <div className="h-full w-full flex items-center justify-center text-gray-400">{t('common.loading')}</div>;

    return (
        <div className="flex h-full min-h-0 flex-col">
            <h3 className="text-sm font-bold text-gray-700 mb-4">{t('dashboard.financialFlow')}</h3>
            {chartData?.length ? (
                <div className="min-h-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barSize={20}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <Tooltip cursor={{ fill: '#f9fafb' }} />
                            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expenses" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-200 text-sm text-gray-400">
                    {t('common.noData')}
                </div>
            )}
        </div>
    );
};

export default RevenueChart;
