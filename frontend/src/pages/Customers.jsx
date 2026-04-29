import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Phone, Mail, MapPin, FileText, Clock, DollarSign, Plus, Search, Download, Loader2, AlertCircle, Eye, X } from 'lucide-react';
import api from '../services/api';
import { exportToCSV } from '../utils/exportUtils';
import Modal from '../components/common/Modal';
import ActionButtons from '../components/common/ActionButtons';
import CustomerForm from '../components/forms/CustomerForm';

const Customers = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const { data: customers = [], isLoading, error } = useQuery({
        queryKey: ['customers'],
        queryFn: () => api.get('/customers').then(res => res.data.data || []),
    });

    const { data: salesOrders = [] } = useQuery({
        queryKey: ['sales-orders'],
        queryFn: () => api.get('/sales/orders').then(res => res.data.data || []),
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['sales-invoices'],
        queryFn: () => api.get('/sales/invoices').then(res => res.data.data || []),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/customers/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['sales-data'] });
        }
    });

    const filtered = customers.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCustomerStats = (customerId) => {
        const orders = salesOrders.filter(o => o.customer_id == customerId);
        const custInvoices = invoices.filter(i => i.customer_id == customerId);
        const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        const unpaidInvoices = custInvoices.filter(
            i => String(i.status || '').toLowerCase() === 'unpaid'
        ).length;
        return { orderCount: orders.length, totalSpent, invoiceCount: custInvoices.length, unpaidInvoices };
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customer Relationship Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage customer profiles, purchase history, and outstanding accounts.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={() => exportToCSV(customers, 'Customers_Export')} className="flex items-center justify-center gap-2 whitespace-nowrap bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 font-medium transition-colors">
                        <Download size={18} /> Export
                    </button>
                    <button onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }} className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap">
                        <Plus size={18} /> Add Customer
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Customers</p>
                            <h3 className="text-2xl font-black text-gray-900 mt-1">{customers.length}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Users size={22} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Orders</p>
                            <h3 className="text-2xl font-black text-gray-900 mt-1">{salesOrders.length}</h3>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <FileText size={22} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</p>
                            <h3 className="text-2xl font-black text-gray-900 mt-1">
                                ${salesOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
                            <DollarSign size={22} />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Invoices</p>
                            <h3 className="text-2xl font-black text-gray-900 mt-1">{invoices.length}</h3>
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Clock size={22} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search customers by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
            </div>

            {/* Customer Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        <p className="text-gray-500">Loading customers...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <AlertCircle className="w-12 h-12 text-red-400" />
                        <p className="text-gray-500">Failed to load customers</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <Users className="w-16 h-16 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
                        <p className="text-gray-500 text-sm">Add your first customer to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Orders</th>
                                    <th className="px-6 py-4">Total Spent</th>
                                    <th className="px-6 py-4">Invoices</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(customer => {
                                    const stats = getCustomerStats(customer.id);
                                    return (
                                        <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center font-bold text-primary-700 text-sm">
                                                        {customer.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{customer.name}</p>
                                                        <p className="text-xs text-gray-400">{customer.address || 'No address'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        <Mail size={13} className="text-gray-400" /> {customer.email || '-'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        <Phone size={13} className="text-gray-400" /> {customer.phone || '-'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                                    {stats.orderCount} orders
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-900">
                                                ${stats.totalSpent.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600">{stats.invoiceCount}</span>
                                                    {stats.unpaidInvoices > 0 && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600">
                                                            {stats.unpaidInvoices} unpaid
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => setSelectedCustomer(customer)} className="p-2 text-gray-400 hover:text-primary-600 transition-colors" title="View Profile">
                                                        <Eye size={16} />
                                                    </button>
                                                    <ActionButtons
                                                        onEdit={() => { setEditingCustomer(customer); setIsModalOpen(true); }}
                                                        onDelete={() => deleteMutation.mutate(customer.id)}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Customer Profile Drawer */}
            {selectedCustomer && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end" onClick={() => setSelectedCustomer(null)}>
                    <div className="w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto animate-slideInRight" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-900">Customer Profile</h2>
                            <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Profile Header */}
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-black mx-auto shadow-lg shadow-primary-500/20">
                                    {selectedCustomer.name?.charAt(0)}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mt-4">{selectedCustomer.name}</h3>
                                <p className="text-sm text-gray-500">{selectedCustomer.email || 'No email'}</p>
                            </div>

                            {/* Contact Info */}
                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Details</h4>
                                <div className="flex items-center gap-3 text-sm"><Mail size={16} className="text-gray-400" /><span>{selectedCustomer.email || '-'}</span></div>
                                <div className="flex items-center gap-3 text-sm"><Phone size={16} className="text-gray-400" /><span>{selectedCustomer.phone || '-'}</span></div>
                                <div className="flex items-center gap-3 text-sm"><MapPin size={16} className="text-gray-400" /><span>{selectedCustomer.address || 'No address on file'}</span></div>
                            </div>

                            {/* Purchase History */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Purchase History</h4>
                                {salesOrders.filter(o => o.customer_id == selectedCustomer.id).length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">No purchases yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {salesOrders.filter(o => o.customer_id == selectedCustomer.id).map(order => (
                                            <div key={order.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100">
                                                <div>
                                                    <p className="font-medium text-sm text-primary-600">{order.order_number}</p>
                                                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-sm">${parseFloat(order.total_amount).toLocaleString()}</p>
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Notes Section */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Internal Notes</h4>
                                <textarea placeholder="Add notes about this customer..." rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 resize-none" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCustomer(null); }} title={editingCustomer ? 'Edit Customer' : 'Add New Customer'} maxWidth="max-w-2xl">
                <CustomerForm
                    key={editingCustomer?.id || 'new'}
                    onSuccess={() => { setIsModalOpen(false); setEditingCustomer(null); }}
                    onCancel={() => { setIsModalOpen(false); setEditingCustomer(null); }}
                    initialData={editingCustomer}
                />
            </Modal>
        </div>
    );
};

export default Customers;
