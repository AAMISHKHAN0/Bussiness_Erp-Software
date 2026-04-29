import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useI18n } from '../../context/I18nContext';

const SalesChart = () => {
    const { locale, t } = useI18n();

    const { data: chartData, isLoading } = useQuery({
        queryKey: ['dashboard-timeseries', locale],
        queryFn: async () => {
            const res = await api.get('/reports/dashboard-timeseries');
            return (res.data.data || []).map((item) => {
                const date = new Date(item.month_start);
                return {
                    name: new Intl.DateTimeFormat(locale, { month: 'short' }).format(date),
                    sales: Number(item.revenue) || 0,
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
            <h3 className="text-sm font-bold text-gray-700 mb-4">{t('dashboard.salesTrends')}</h3>
            {chartData?.length ? (
                <div className="min-h-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} offset={10} />
                            <Tooltip />
                            <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="#eff6ff" strokeWidth={2} />
                        </AreaChart>
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

export default SalesChart;
