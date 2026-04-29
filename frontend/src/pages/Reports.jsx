import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp, Package, Users, DollarSign, Download, Filter,
    ArrowUpRight, Loader2, Search, XCircle
} from 'lucide-react';
import api from '../services/api';
import { exportToCSV } from '../utils/exportUtils';

const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

const Reports = () => {
    const [salesData, setSalesData] = useState([]);
    const [inventoryData, setInventoryData] = useState([]);
    const [hrData, setHrData] = useState([]);
    const [loading, setLoading] = useState(true);

    // BI Enhancements: Filters & Drill-down
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [drillDownData, setDrillDownData] = useState(null);

    useEffect(() => {
        fetchReports();
    }, [selectedMonth, selectedCategory]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const salesParams = selectedMonth ? `?month=${selectedMonth}` : '';
            const invParams = selectedCategory ? `?category=${selectedCategory}` : '';

            const [salesRes, invRes, hrRes] = await Promise.all([
                api.get(`/reports/sales-summary${salesParams}`),
                api.get(`/reports/inventory-summary${invParams}`),
                api.get('/reports/hr-summary')
            ]);
            setSalesData(salesRes.data.data);
            setInventoryData(invRes.data.data);
            setHrData(hrRes.data.data);
        } catch (err) {
            console.error('Failed to fetch reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChartClick = (data) => {
        if (data && data.activePayload) {
            setDrillDownData(data.activePayload[0].payload);
        }
    };

    if (loading && !salesData.length) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="animate-spin text-primary-600" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Advanced Business Intelligence</h1>
                    <p className="text-gray-500">Drill down into your business metrics and performance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                        <Filter size={16} className="text-gray-400" />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="text-sm bg-transparent border-none outline-none font-medium text-gray-700"
                        >
                            <option value="">All Months</option>
                            {['Jan', 'Feb', 'Mar', 'Apr'].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <button 
                        onClick={() => {
                            if (salesData.length) exportToCSV(salesData, 'sales_report');
                            if (inventoryData.length) exportToCSV(inventoryData, 'inventory_report');
                            if (hrData.length) exportToCSV(hrData, 'hr_report');
                        }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Download size={18} />
                        Export Data
                    </button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                    const totalRevenue = salesData.reduce((s, d) => s + Number(d.revenue || 0), 0);
                    const totalPayroll = hrData.reduce((s, d) => s + Number(d.total_salary || 0), 0);
                    const totalEmployees = hrData.reduce((s, d) => s + Number(d.count || 0), 0);
                    const grossProfit = totalRevenue - totalPayroll;
                    const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0.0';

                    const kpis = [
                        { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, target: 'All Time', progress: totalRevenue > 0 ? 100 : 0, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Profit Margin', value: `${profitMargin}%`, target: `Revenue: $${totalRevenue.toLocaleString()}`, progress: Math.min(Number(profitMargin), 100), color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Monthly Payroll', value: `$${totalPayroll.toLocaleString()}`, target: `${totalEmployees} Staff`, progress: totalPayroll > 0 ? 75 : 0, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Departments', value: `${hrData.length}`, target: `${totalEmployees} Employees`, progress: hrData.length > 0 ? 100 : 0, color: 'text-rose-600', bg: 'bg-rose-50' },
                    ];

                    return kpis.map((kpi, i) => (
                        <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
                                <div className={`${kpi.bg} p-1.5 rounded-md`}>
                                    <ArrowUpRight size={14} className={kpi.color} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold text-gray-900">{kpi.value}</h3>
                                <span className="text-xs text-gray-400">{kpi.target}</span>
                            </div>
                            <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${kpi.color.replace('text', 'bg')}`}
                                    style={{ width: `${kpi.progress}%` }}
                                />
                            </div>
                        </div>
                    ));
                })()}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-gray-900">Performance Matrix</h3>
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">Interactive Drill-down Enabled</span>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesData} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend iconType="circle" verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
                                <Bar dataKey="revenue" name="Revenue" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={40} />
                                <Bar dataKey="profit" name="Profit" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Inventory Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-8">Asset Liquidity</h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={inventoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={8}
                                    dataKey="total_value"
                                    nameKey="category"
                                    stroke="none"
                                >
                                    {inventoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-3">
                        {inventoryData.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-gray-600">{item.category}</span>
                                </div>
                                <span className="font-bold text-gray-900">${(item.total_value / 1000).toFixed(1)}k</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Drill-down Detail Modal/Section */}
            {drillDownData && (
                <div className="animate-slideUp bg-white p-6 rounded-xl border-t-4 border-primary-600 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Search size={18} className="text-primary-600" />
                            Detailed Breakdown: {drillDownData.month || drillDownData.category}
                        </h3>
                        <button onClick={() => setDrillDownData(null)} className="text-gray-400 hover:text-gray-600">
                            <XCircle size={20} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Impact</p>
                            <p className="text-2xl font-black text-gray-900">
                                ${(drillDownData.revenue || drillDownData.total_value).toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Contribution</p>
                            <div className="flex items-center justify-center gap-1 text-primary-600 font-bold">
                                {(() => {
                                    const total = salesData.reduce((s, d) => s + Number(d.revenue || 0), 0);
                                    const val = drillDownData.revenue || drillDownData.total_value || 0;
                                    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                                    return `${pct}%`;
                                })()}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg text-right">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Status</p>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${(drillDownData.revenue || drillDownData.total_value) > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {(drillDownData.revenue || drillDownData.total_value) > 0 ? 'Active' : 'No Data'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* HR / Department Summary */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-6">Staffing & Payroll by Department</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4 rounded-l-lg">Department</th>
                                <th className="px-6 py-4">Total Staff</th>
                                <th className="px-6 py-4">Monthly Payroll</th>
                                <th className="px-6 py-4 rounded-r-lg">Efficiency</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {hrData.map((dept, i) => (
                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{dept.department}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{dept.count} Members</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">${parseInt(dept.total_salary).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 max-w-[100px]">
                                            <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
