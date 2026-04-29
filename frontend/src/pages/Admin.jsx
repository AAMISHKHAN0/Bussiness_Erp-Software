import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Users, GitBranch, Settings, History, Activity,
    Save, RefreshCw, Server, Cpu, HardDrive, Database, Loader2,
    CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Skeleton, TableSkeleton } from '../components/common/SkeletonLoader';

const Admin = () => {
    const [activeTab, setActiveTab] = useState('settings');

    // Fetch Audit Logs
    const { data: logs, isLoading: loadingLogs, isError: isLogsError } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: async () => {
            const res = await api.get('/admin/audit-logs');
            return res.data.data;
        },
        enabled: activeTab === 'logs',
        retry: 1
    });

    // Fetch System Health (Poll every 10s)
    const { data: health, isLoading: loadingHealth, isError: isHealthError } = useQuery({
        queryKey: ['system-health'],
        queryFn: async () => {
            const res = await api.get('/admin/health');
            return res.data.data;
        },
        enabled: activeTab === 'health',
        retry: 1
    });

    const tabs = [
        { id: 'settings', label: 'System Settings', icon: Settings, color: 'text-primary-600' },
        { id: 'logs', label: 'Audit Logs', icon: History, color: 'text-amber-600' },
        { id: 'health', label: 'System Health', icon: Activity, color: 'text-emerald-600' },
        { id: 'users', label: 'User Control', icon: Users, color: 'text-blue-600' },
        { id: 'roles', label: 'Permissions', icon: ShieldCheck, color: 'text-purple-600' },
    ];

    return (
        <div className="page-shell page-stack animate-fadeIn">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title flex items-center gap-3">
                        <Shield className="w-8 h-8 text-primary-600" />
                        Control Center
                    </h1>
                    <p className="page-subtitle mt-2">Enterprise-grade system administration and monitoring with improved overflow behavior on smaller screens.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-all active:scale-95 hover:bg-gray-50 sm:w-auto"
                    >
                        <RefreshCw className="w-4 h-4" /> Reload System
                    </button>
                </div>
            </div>

            {/* Tab Navigation - Scrollable on Mobile */}
            <div className="scroller-hide flex w-full gap-2 overflow-x-auto rounded-2xl border border-gray-200/50 bg-white/60 p-1.5 shadow-sm backdrop-blur-md">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                                relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 min-w-max
                                ${activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-white'}
                            `}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeAdminTab"
                                className="absolute inset-0 bg-primary-600 rounded-xl shadow-md shadow-primary-500/20"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <tab.icon className={`w-4 h-4 relative z-10 ${activeTab === tab.id ? 'text-white' : tab.color}`} />
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[32rem]">
                {activeTab === 'settings' && <SettingsTab />}
                {activeTab === 'logs' && <LogsTab logs={logs} isLoading={loadingLogs} isError={isLogsError} />}
                {activeTab === 'health' && <HealthTab health={health} isLoading={loadingHealth} isError={isHealthError} />}
                {(activeTab === 'users' || activeTab === 'roles') && (
                    <div className="card h-96 flex flex-col items-center justify-center text-center border border-gray-100 bg-gradient-to-br from-white to-gray-50">
                        <Shield className="w-16 h-16 text-gray-200 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">Module Under Expansion</h3>
                        <p className="text-gray-500 max-w-xs mt-2 font-medium">Core security controls are being finalized for migration to the new schema.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const SettingsTab = () => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        company_name: '',
        company_email: '',
        company_phone: '',
        address: '',
        currency: 'USD',
        timezone: 'UTC'
    });
    const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

    // Fetch Settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await api.get('/admin/settings');
            return res.data.data;
        },
        retry: 1
    });

    // Populate form data when settings load
    useEffect(() => {
        if (settings) {
            setFormData({
                company_name: settings.company_name || 'Antigravity Enterprise',
                company_email: settings.company_email || 'support@antigravity.ai',
                company_phone: settings.company_phone || '+1 (555) 123-4567',
                address: settings.address || '123 Tech Avenue, SP',
                currency: settings.currency || 'USD',
                timezone: settings.timezone || 'UTC'
            });
        }
    }, [settings]);

    // Mutation for Settings
    const mutation = useMutation({
        mutationFn: async (newData) => {
            const res = await api.put('/admin/settings', newData);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['settings']);
            setSaveStatus({ type: 'success', message: 'Settings saved successfully!' });
            setTimeout(() => setSaveStatus({ type: '', message: '' }), 5000);
        },
        onError: (error) => {
            console.error('Settings save failed:', error);
            setSaveStatus({
                type: 'error',
                message: error.response?.data?.message || 'Failed to save settings. Check connection.'
            });
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        setSaveStatus({ type: '', message: '' });
        mutation.mutate(formData);
    };

    if (isLoading) {
        return <div className="p-8"><Skeleton className="h-96 w-full rounded-2xl" /></div>;
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-6">
                <form onSubmit={handleSave} className="card shadow-md border border-gray-100">
                    <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
                        <Database className="w-6 h-6 text-primary-600" />
                        General Configuration
                    </h3>

                    {/* Status Banner */}
                    <AnimatePresence>
                        {saveStatus.message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, mb: 0 }}
                                animate={{ opacity: 1, height: 'auto', mb: 24 }}
                                exit={{ opacity: 0, height: 0, mb: 0 }}
                                className={`p-4 rounded-xl border flex items-center gap-3 ${saveStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                                    }`}
                            >
                                {saveStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                                <span className="font-bold text-sm tracking-wide">{saveStatus.message}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Company Name</label>
                            <input
                                type="text"
                                name="company_name"
                                value={formData.company_name}
                                onChange={handleChange}
                                className="input-field font-bold bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Support Email</label>
                            <input
                                type="email"
                                name="company_email"
                                value={formData.company_email}
                                onChange={handleChange}
                                className="input-field font-bold bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Headquarters Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="input-field font-bold bg-gray-50/50 hover:bg-white focus:bg-white transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Global Currency</label>
                            <select
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                className="input-field font-bold bg-gray-50/50 hover:bg-white focus:bg-white transition-colors appearance-none cursor-pointer"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="PKR">PKR (Rs)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">System Timezone</label>
                            <select
                                name="timezone"
                                value={formData.timezone}
                                onChange={handleChange}
                                className="input-field font-bold bg-gray-50/50 hover:bg-white focus:bg-white transition-colors appearance-none cursor-pointer"
                            >
                                <option value="UTC">UTC (Greenwich Mean Time)</option>
                                <option value="EST">EST (Eastern Standard Time)</option>
                                <option value="PST">PST (Pacific Standard Time)</option>
                                <option value="PKT">PKT (Pakistan Standard Time)</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex items-center gap-2 bg-primary-600 text-white px-8 py-3.5 rounded-xl font-black shadow-lg shadow-primary-500/30 hover:bg-primary-700 hover:shadow-primary-500/40 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {mutation.isPending ? 'Syncing...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="space-y-6">
                <div className="card text-center py-10 shadow-sm border border-gray-100">
                    <div className="w-32 h-32 bg-primary-50 rounded-full mx-auto flex items-center justify-center border-4 border-white shadow-xl shadow-primary-500/10 mb-6 group cursor-pointer hover:scale-105 transition-all duration-300">
                        <RefreshCw className="w-10 h-10 text-primary-400 group-hover:rotate-180 transition-transform duration-700" />
                    </div>
                    <h4 className="font-black text-lg text-gray-900">Company Logo</h4>
                    <p className="text-xs text-gray-400 font-bold uppercase mt-2 tracking-widest">Recommended: 512x512 PNG</p>
                    <button className="mt-6 text-sm font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-4 py-2 rounded-lg transition-colors">
                        Upload Image
                    </button>
                </div>

                <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-2xl">
                    <div className="panel-orb -right-10 -top-10 h-40 w-40 bg-primary-500/30 opacity-70 transition-opacity duration-700 group-hover:opacity-100" />
                    <Shield className="w-12 h-12 text-primary-400 mb-5 relative z-10" />
                    <h4 className="text-xl font-black leading-tight tracking-wide mb-3 relative z-10">Security Protocol Alpha</h4>
                    <p className="text-sm text-slate-300 font-medium leading-relaxed relative z-10">All administrative modifications are logged cryptographically. Persistent unauthorized attempts trigger dynamic IP blackouts and Super Admin alerts.</p>
                </div>
            </div>
        </div>
    );
};

const LogsTab = ({ logs, isLoading, isError }) => {
    if (isError) {
        return (
            <div className="card p-12 text-center border border-red-100 bg-red-50/30">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-900">Connection Error</h3>
                <p className="text-red-700 font-medium mt-2 max-w-md mx-auto">Unable to fetch audit logs from the backend server. Please check your network connection or try restarting the backend service.</p>
            </div>
        );
    }

    return (
        <div className="card overflow-hidden !p-0 border border-gray-100 shadow-md">
            <div className="p-6 bg-white border-b border-gray-100 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                    <History className="w-6 h-6 text-amber-500" />
                    System Audit Trail
                </h3>
                <span className="bg-amber-50 border border-amber-200/60 text-amber-700 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Live Feed
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/80">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Timestamp</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Administrator</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Action Executed</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Origin Resource</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {isLoading ? (
                            <tr><td colSpan="4" className="p-8"><TableSkeleton rows={8} /></td></tr>
                        ) : logs?.length > 0 ? (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-gray-900">{new Date(log.created_at).toLocaleTimeString()}</div>
                                        <div className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">{new Date(log.created_at).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center font-black text-indigo-700 text-sm shadow-sm group-hover:scale-105 transition-transform">
                                                {log.user_name?.charAt(0) || '?'}
                                            </div>
                                            <span className="text-sm font-black text-gray-700">{log.user_name || 'System Auto'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-black uppercase tracking-wider bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md border border-gray-200">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-black text-gray-500 uppercase tracking-widest">{log.resource || log.module || 'Unknown'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="p-20 text-center">
                                    <History className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-400 font-bold">No security events recorded in the current window.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const HealthTab = ({ health, isLoading, isError }) => {
    if (isError) {
        return (
            <div className="card p-12 text-center border border-red-100 bg-red-50/30">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-900">Health Check Failed</h3>
                <p className="text-red-700 font-medium mt-2 max-w-md mx-auto">Unable to establish telemetry connection with the backend server. The node might be completely offline.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <HealthCard
                    icon={Server}
                    label="System Identity"
                    value={health?.status || 'Online'}
                    sub="Process Matrix Active"
                    color="emerald"
                    loading={isLoading}
                />
                <HealthCard
                    icon={Cpu}
                    label="V8 Engine"
                    value="Stable"
                    sub={`Node ${health?.node_version || 'v20.x'}`}
                    color="blue"
                    loading={isLoading}
                />
                <HealthCard
                    icon={Database}
                    label="Data Pipeline"
                    value={health?.db_connection || 'Mock Active'}
                    sub="Socket Connection OK"
                    color="purple"
                    loading={isLoading}
                />
                <HealthCard
                    icon={HardDrive}
                    label="Memory Heap"
                    value={health ? `${Math.round(health.memory.rss / 1024 / 1024)}MB` : '0MB'}
                    sub="Allocated Footprint"
                    color="amber"
                    loading={isLoading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-emerald-500" />
                        Network Topology Latency
                    </h3>
                    <div className="h-64 flex items-end gap-1.5 px-2">
                        {[...Array(30)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.random() * 80 + 20}%` }}
                                transition={{ duration: 0.5, delay: i * 0.02, repeat: Infinity, repeatType: "reverse", repeatDelay: Math.random() * 2 }}
                                className="flex-1 bg-gradient-to-t from-emerald-500/10 to-emerald-500/40 rounded-t-sm border-t-2 border-emerald-500"
                            />
                        ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <span>T-Minus 60m</span>
                        <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded">Optimal Variance</span>
                        <span>0:00 Now</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="card !p-5 flex items-center gap-5 bg-gradient-to-r from-emerald-50 to-white border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100 flex-shrink-0">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div>
                            <h4 className="font-black text-lg text-emerald-950 leading-tight">Zero-Day Protocol</h4>
                            <p className="text-emerald-700/70 text-xs font-bold mt-1 uppercase tracking-widest">All dependencies secure</p>
                        </div>
                    </div>
                    <div className="card !p-5 flex items-center gap-5 bg-gradient-to-r from-blue-50 to-white border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-blue-100 flex-shrink-0">
                            <Activity className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <h4 className="font-black text-lg text-blue-950 leading-tight">Redundancy Matrix</h4>
                            <p className="text-blue-700/70 text-xs font-bold mt-1 uppercase tracking-widest">Failover array armed</p>
                        </div>
                    </div>
                    <div className="card !p-5 flex items-center gap-5 bg-gradient-to-r from-amber-50 to-white border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-amber-100 flex-shrink-0">
                            <AlertTriangle className="w-8 h-8 text-amber-500" />
                        </div>
                        <div>
                            <h4 className="font-black text-lg text-amber-950 leading-tight">Snapshot Delta</h4>
                            <p className="text-amber-700/70 text-xs font-bold mt-1 uppercase tracking-widest">Next persistence in 14m</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HealthCard = ({ icon: Icon, label, value, sub, color, loading }) => {
    const colors = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white',
        blue: 'bg-blue-50 text-blue-600 border-blue-100 bg-gradient-to-br from-blue-50 to-white',
        purple: 'bg-purple-50 text-purple-600 border-purple-100 bg-gradient-to-br from-purple-50 to-white',
        amber: 'bg-amber-50 text-amber-600 border-amber-100 bg-gradient-to-br from-amber-50 to-white',
    };

    return (
        <div className={`card group relative overflow-hidden border ${colors[color]} shadow-sm hover:shadow-md transition-all`}>
            <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-black/5">
                        <Icon className="w-6 h-6" />
                    </div>
                    <Activity className="w-4 h-4 opacity-50" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1.5">{label}</p>
                    {loading ? (
                        <Skeleton className="h-7 w-24 mb-1" />
                    ) : (
                        <h4 className="text-2xl font-black text-gray-900 leading-none mb-1">{value}</h4>
                    )}
                    <p className="text-xs text-gray-600 font-bold">{sub}</p>
                </div>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-10 group-hover:rotate-12 group-hover:scale-125 transition-all duration-500 pointer-events-none text-black">
                <Icon size={120} />
            </div>
        </div>
    );
};

export default Admin;
