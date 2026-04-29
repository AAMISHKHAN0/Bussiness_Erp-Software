import { ReportRepository } from '../repositories/reportRepository';
import { Pool } from "pg";

export class ReportService {
    /**
     * Get Sales trends and summaries
     */
    static async getSalesSummary(db: Pool, month?: string) {
        return await ReportRepository.getSalesTrends(db, month);
    }

    /**
     * Get real dashboard chart time-series
     */
    static async getDashboardTimeSeries(db: Pool, months = 6) {
        return await ReportRepository.getDashboardTimeSeries(db, months);
    }

    /**
     * Get inventory levels and summaries
     */
    static async getInventorySummary(db: Pool, category?: string) {
        return await ReportRepository.getInventorySummary(db, category);
    }

    /**
     * Get HR headcount and department wise payroll
     */
    static async getHRHeadcount(db: Pool) {
        return await ReportRepository.getHRHeadcount(db);
    }

    /**
     * Get Dashboard KPIs
     */
    static async getDashboardStats(db: Pool) {
        const kpis = await ReportRepository.getDashboardKPIs(db);
        const timeSeries = await ReportRepository.getDashboardTimeSeries(db, 2);
        const previousPeriod = timeSeries[0] || { revenue: 0, sales_count: 0 };
        const currentPeriod = timeSeries[1] || { revenue: 0, sales_count: 0 };

        const formatPercentDelta = (current: number, previous: number) => {
            if (previous === 0) {
                return current > 0 ? '+100%' : '0%';
            }

            const delta = ((current - previous) / previous) * 100;
            const prefix = delta > 0 ? '+' : '';
            return `${prefix}${delta.toFixed(1)}%`;
        };

        const getTrend = (current: number, previous: number) => {
            if (current > previous) return 'up';
            if (current < previous) return 'down';
            return 'neutral';
        };

        const stats = [
            {
                title: 'Total Revenue',
                value: kpis.totalRevenue,
                change: formatPercentDelta(Number(currentPeriod.revenue) || 0, Number(previousPeriod.revenue) || 0),
                trend: getTrend(Number(currentPeriod.revenue) || 0, Number(previousPeriod.revenue) || 0),
                isCurrency: true
            },
            {
                title: 'Total Sales',
                value: kpis.totalSales,
                change: formatPercentDelta(Number(currentPeriod.sales_count) || 0, Number(previousPeriod.sales_count) || 0),
                trend: getTrend(Number(currentPeriod.sales_count) || 0, Number(previousPeriod.sales_count) || 0)
            },
            {
                title: 'Products',
                value: kpis.totalProducts,
                change: kpis.totalProducts > 0 ? kpis.totalProducts + ' active' : '0',
                trend: 'neutral'
            },
            {
                title: 'Employees',
                value: kpis.totalEmployees,
                change: kpis.totalEmployees > 0 ? kpis.totalEmployees + ' staff' : '0',
                trend: 'neutral'
            },
            {
                title: 'Critical Stock',
                value: kpis.lowStockItems.length,
                details: kpis.lowStockItems
            }
        ];

        return stats;
    }
}
