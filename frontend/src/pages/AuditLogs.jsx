import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    History,
    Search,
    Filter,
    User,
    Activity,
    Database,
    Calendar,
    ChevronLeft,
    ChevronRight,
    SearchX,
    Eye
} from 'lucide-react';
import api from '../services/api';

const AuditLogs = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState('ALL');

    const { data: logsData, isLoading } = useQuery({
        queryKey: ['audit-logs', page, searchTerm, actionFilter],
        queryFn: async () => {
            const res = await api.get('/admin/audit-logs');
            // Mock filtering on frontend if backend doesn't support it yet
            let logs = res.data.data || [];
            if (searchTerm) {
                logs = logs.filter(l =>
                    l.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    l.resource?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            if (actionFilter !== 'ALL') {
                logs = logs.filter(l => l.action === actionFilter);
            }
            return logs;
        }
    });

    const getActionColor = (action) => {
        switch (action) {
            case 'POST': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'PUT': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
                    <p className="text-gray-500 mt-1">Track system activity and security events</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100">
                    <Activity className="w-4 h-4 text-primary-500" />
                    <span className="text-sm font-semibold text-gray-700">Live Tracking Enabled</span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[240px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by user or resource..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        className="bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-500 py-2 pr-8"
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                    >
                        <option value="ALL">All Actions</option>
                        <option value="POST">Created (POST)</option>
                        <option value="PUT">Updated (PUT)</option>
                        <option value="DELETE">Deleted (DELETE)</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Event Time</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Action</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Resource</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : logsData?.length > 0 ? (
                                logsData.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-sm whitespace-nowrap">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center text-xs font-bold">
                                                    {log.user_name?.charAt(0) || 'S'}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{log.user_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded border uppercase tracking-widest ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Database className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-sm font-medium">{log.resource}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-md">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-gray-500 truncate italic">
                                                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                                </p>
                                                <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-primary-500 transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <SearchX className="w-12 h-12 text-gray-200 mb-3" />
                                            <p className="text-sm font-medium text-gray-500">No activity logs found</p>
                                            <p className="text-xs text-gray-400 mt-1">Try broadening your search or filter</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                        Showing {logsData?.length || 0} recent activities
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
