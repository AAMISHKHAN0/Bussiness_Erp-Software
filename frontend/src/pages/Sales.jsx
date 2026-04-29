import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Users, Receipt, Loader2, AlertCircle, Plus, Search, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { exportToCSV } from '../utils/exportUtils';
import { generateInvoicePDF } from '../utils/generateInvoicePDF';
import Modal from '../components/common/Modal';
import ActionButtons from '../components/common/ActionButtons';
import CustomerForm from '../components/forms/CustomerForm';

const Sales = () => {
    const [activeTab, setActiveTab] = useState('orders');
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['sales-data'],
        queryFn: async () => {
            const [ordersRes, customersRes, invoicesRes] = await Promise.all([
                api.get('/sales/orders').catch(() => ({ data: { data: [] } })),
                api.get('/customers').catch(() => ({ data: { data: [] } })),
                api.get('/sales/invoices').catch(() => ({ data: { data: [] } }))
            ]);
            return {
                orders: ordersRes.data.data || [],
                customers: customersRes.data.data || [],
                invoices: invoicesRes.data.data || []
            };
        },
    });

    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    const deleteMutation = useMutation({
        mutationFn: ({ endpoint, id }) => api.delete(`${endpoint}/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales-data'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
    });

    const handleExport = () => {
        if (!data) return;
        if (activeTab === 'orders') exportToCSV(data.orders, 'SalesOrders_Export');
        if (activeTab === 'customers') exportToCSV(data.customers, 'Customers_Export');
        if (activeTab === 'invoices') exportToCSV(data.invoices, 'Invoices_Export');
    };

    const salesData = data || { orders: [], customers: [], invoices: [] };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">Sales Management</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Manage customers, sales orders, and invoicing.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={handleExport} className="btn-secondary flex items-center justify-center gap-2 whitespace-nowrap glass hover:bg-gray-50 h-[42px]">
                        <Download size={18} /> Export
                    </button>
                    <button
                        onClick={() => {
                            if (activeTab === 'orders') navigate('/sales/new');
                            if (activeTab === 'customers') { setEditingCustomer(null); setIsCustomerModalOpen(true); }
                            if (activeTab === 'invoices') navigate('/invoices/new');
                        }}
                        className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-primary-500/20 h-[42px]"
                    >
                        <Plus size={18} />
                        Create {activeTab === 'orders' ? 'Sales Order' : activeTab === 'customers' ? 'Customer' : 'Invoice'}
                    </button>
                </div>
            </div>

            <div className="flex border-b border-gray-200 hide-scrollbar overflow-x-auto">
                <button onClick={() => setActiveTab('orders')} className={`flex-shrink-0 px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <ShoppingCart size={18} /> Sales Orders
                </button>
                <button onClick={() => setActiveTab('customers')} className={`flex-shrink-0 px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'customers' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <Users size={18} /> Customers
                </button>
                <button onClick={() => setActiveTab('invoices')} className={`flex-shrink-0 px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'invoices' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <Receipt size={18} /> Invoices
                </button>
            </div>

            <div className="flex items-center gap-4 glass p-4 rounded-2xl shadow-sm border border-white/40">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder={`Search ${activeTab}...`} className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" />
                </div>
                <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50 glass">
                    <option>All Statuses</option>
                    <option>Pending</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                </select>
            </div>

            <div className="glass rounded-2xl shadow-sm border border-white/40 min-h-[400px] overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        <p className="text-gray-500">Loading sales data...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4 max-w-md mx-auto text-center p-6 glass-dark/5 rounded-2xl m-6 border border-white/20">
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2"><AlertCircle size={24} /></div>
                        <h3 className="text-lg font-medium text-gray-900">Database Offline</h3>
                        <p className="text-gray-500 text-sm">The backend cannot connect to the database.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {activeTab === 'orders' && (
                            salesData.orders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <div className="w-16 h-16 bg-white/50 glass rounded-2xl flex items-center justify-center border border-white/40"><ShoppingCart size={32} className="text-gray-400" /></div>
                                    <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
                                    <p className="text-gray-500 text-sm">Create your first sales order to see it here.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-bold border-b border-gray-100/50">
                                        <tr>
                                            <th className="px-6 py-4">Order Number</th>
                                            <th className="px-6 py-4">Customer</th>
                                            <th className="px-6 py-4">Total Amount</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100/50 bg-white/30 backdrop-blur-sm">
                                        {salesData.orders.map(order => (
                                            <tr key={order.id} className="hover:bg-primary-50/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap font-bold text-primary-600">{order.order_number}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{order.customer_name || 'Guest'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${parseFloat(order.total_amount).toLocaleString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${order.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : order.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{new Date(order.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <ActionButtons
                                                        onEdit={() => navigate(`/sales/${order.id}/edit`)}
                                                        onDelete={() => deleteMutation.mutate({ endpoint: '/sales/orders', id: order.id })}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}

                        {activeTab === 'customers' && (
                            salesData.customers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <div className="w-16 h-16 bg-white/50 glass rounded-2xl flex items-center justify-center border border-white/40"><Users size={32} className="text-gray-400" /></div>
                                    <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
                                    <p className="text-gray-500 text-sm">Create your first customer record to see it here.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-bold border-b border-gray-100/50">
                                        <tr>
                                            <th className="px-6 py-4">Name</th>
                                            <th className="px-6 py-4">Email</th>
                                            <th className="px-6 py-4">Phone</th>
                                            <th className="px-6 py-4">Branch</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100/50 bg-white/30">
                                        {salesData.customers.map(customer => (
                                            <tr key={customer.id} className="hover:bg-primary-50/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{customer.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{customer.email || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{customer.phone || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{customer.branch_name || 'All'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <ActionButtons
                                                        onEdit={() => { setEditingCustomer(customer); setIsCustomerModalOpen(true); }}
                                                        onDelete={() => deleteMutation.mutate({ endpoint: '/customers', id: customer.id })}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}

                        {activeTab === 'invoices' && (
                            salesData.invoices.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <div className="w-16 h-16 bg-white/50 glass rounded-2xl flex items-center justify-center border border-white/40"><FileText size={32} className="text-gray-400" /></div>
                                    <h3 className="text-lg font-medium text-gray-900">No invoices found</h3>
                                    <p className="text-gray-500 text-sm">Create an invoice from a sales order to see it here.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-bold border-b border-gray-100/50">
                                        <tr>
                                            <th className="px-6 py-4">Invoice #</th>
                                            <th className="px-6 py-4">Customer</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100/50 bg-white/30">
                                        {salesData.invoices.map(invoice => (
                                            <tr key={invoice.id} className="hover:bg-primary-50/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap font-bold text-primary-600">{invoice.invoice_number}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{invoice.customer_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${parseFloat(invoice.grand_total || 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : invoice.status === 'Unpaid' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {invoice.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => generateInvoicePDF(invoice)}
                                                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="Download PDF"
                                                    >
                                                        <FileText size={18} />
                                                    </button>
                                                    <ActionButtons onDelete={() => deleteMutation.mutate({ endpoint: '/sales/invoices', id: invoice.id })} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}
                    </div>
                )}
            </div>

            <Modal isOpen={isCustomerModalOpen} onClose={() => { setIsCustomerModalOpen(false); setEditingCustomer(null); }} title={editingCustomer ? 'Edit Customer' : 'Add New Customer'} maxWidth="max-w-2xl">
                <CustomerForm
                    key={editingCustomer?.id || 'new'}
                    onSuccess={() => { setIsCustomerModalOpen(false); setEditingCustomer(null); }}
                    onCancel={() => { setIsCustomerModalOpen(false); setEditingCustomer(null); }}
                    initialData={editingCustomer}
                />
            </Modal>
        </div>
    );
};

export default Sales;
