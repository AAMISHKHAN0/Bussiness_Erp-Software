import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, ShoppingBag, Receipt, Loader2, AlertCircle, Plus, Search, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { exportToCSV } from '../utils/exportUtils';
import Modal from '../components/common/Modal';
import ActionButtons from '../components/common/ActionButtons';
import SupplierForm from '../components/forms/SupplierForm';
import GrnForm from '../components/forms/GrnForm';

const Purchase = () => {
    const [activeTab, setActiveTab] = useState('orders');
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['purchase-data'],
        queryFn: async () => {
            const [ordersRes, suppliersRes] = await Promise.all([
                api.get('/purchases/orders').catch(() => ({ data: { data: [] } })),
                api.get('/suppliers').catch(() => ({ data: { data: [] } }))
            ]);
            return {
                orders: ordersRes.data.data || [],
                suppliers: suppliersRes.data.data || [],
                grn: []
            };
        },
    });

    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isGrnModalOpen, setIsGrnModalOpen] = useState(false);

    const deleteMutation = useMutation({
        mutationFn: ({ endpoint, id }) => api.delete(`${endpoint}/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-data'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
    });

    const purchaseData = data || { orders: [], suppliers: [], grn: [] };

    const handleExport = () => {
        if (activeTab === 'orders') exportToCSV(purchaseData.orders, 'PurchaseOrders_Export');
        if (activeTab === 'suppliers') exportToCSV(purchaseData.suppliers, 'Suppliers_Export');
        if (activeTab === 'grn') exportToCSV(purchaseData.grn, 'GRN_Export');
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Purchase Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage suppliers, purchase orders, and procurement.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={handleExport} className="btn-secondary flex items-center justify-center gap-2 whitespace-nowrap bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 font-medium transition-colors">
                        <Download size={18} /> Export
                    </button>
                    <button
                        onClick={() => {
                            if (activeTab === 'orders') navigate('/purchases/new');
                            if (activeTab === 'suppliers') setIsSupplierModalOpen(true);
                            if (activeTab === 'grn') setIsGrnModalOpen(true);
                        }}
                        className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <Plus size={18} />
                        Create {activeTab === 'orders' ? 'Purchase Order' : activeTab === 'suppliers' ? 'Supplier' : 'GRN'}
                    </button>
                </div>
            </div>

            <div className="flex border-b border-gray-200 hide-scrollbar overflow-x-auto">
                <button onClick={() => setActiveTab('orders')} className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'orders' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <ShoppingBag size={18} /> Purchase Orders
                </button>
                <button onClick={() => setActiveTab('suppliers')} className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'suppliers' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <Truck size={18} /> Suppliers
                </button>
                <button onClick={() => setActiveTab('grn')} className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'grn' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <Receipt size={18} /> Goods Receiving
                </button>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder={`Search ${activeTab}...`} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" />
                </div>
                <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                    <option>All Statuses</option>
                    <option>Ordered</option>
                    <option>Received</option>
                    <option>Cancelled</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        <p className="text-gray-500">Loading purchase data...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4 max-w-md mx-auto text-center p-6 bg-gray-50 rounded-lg m-6 border border-gray-100">
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2"><AlertCircle size={24} /></div>
                        <h3 className="text-lg font-medium text-gray-900">Database Offline</h3>
                        <p className="text-gray-500 text-sm">The backend cannot connect to the database.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {activeTab === 'orders' && (
                            purchaseData.orders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100"><ShoppingBag size={32} className="text-gray-400" /></div>
                                    <h3 className="text-lg font-medium text-gray-900">No purchase orders found</h3>
                                    <p className="text-gray-500 text-sm">Create your first purchase order to see it here.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4">PO Number</th>
                                            <th className="px-6 py-4">Supplier</th>
                                            <th className="px-6 py-4">Total Amount</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Expected Date</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {purchaseData.orders.map(order => (
                                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-primary-600">{order.po_number}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{order.supplier_name}</td>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">${parseFloat(order.total_amount).toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'Completed' || order.status === 'Received' ? 'bg-emerald-100 text-emerald-800' : order.status === 'Pending' || order.status === 'Ordered' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{order.expected_date ? new Date(order.expected_date).toLocaleDateString() : '-'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <ActionButtons
                                                        onEdit={() => navigate(`/purchases/${order.id}/edit`)}
                                                        onDelete={() => deleteMutation.mutate({ endpoint: '/purchases/orders', id: order.id })}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}

                        {activeTab === 'suppliers' && (
                            purchaseData.suppliers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100"><Truck size={32} className="text-gray-400" /></div>
                                    <h3 className="text-lg font-medium text-gray-900">No suppliers found</h3>
                                    <p className="text-gray-500 text-sm">Create your first supplier record to see it here.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4">Name</th>
                                            <th className="px-6 py-4">Contact Person</th>
                                            <th className="px-6 py-4">Email</th>
                                            <th className="px-6 py-4">Phone</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {purchaseData.suppliers.map(supplier => (
                                            <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900">{supplier.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{supplier.contact_person || '-'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{supplier.email || '-'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{supplier.phone || '-'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <ActionButtons onDelete={() => deleteMutation.mutate({ endpoint: '/suppliers', id: supplier.id })} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}

                        {activeTab === 'grn' && (
                            purchaseData.grn.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100"><FileText size={32} className="text-gray-400" /></div>
                                    <h3 className="text-lg font-medium text-gray-900">No GRNs found</h3>
                                    <p className="text-gray-500 text-sm">Create a Goods Receiving Note to see it here.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4">GRN Number</th>
                                            <th className="px-6 py-4">PO Reference</th>
                                            <th className="px-6 py-4">Received Date</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {purchaseData.grn.map(receipt => (
                                            <tr key={receipt.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-primary-600">{receipt.grn_number}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{receipt.po_number || '-'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(receipt.received_date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Received</span>
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

            <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title="Add New Supplier" maxWidth="max-w-2xl">
                <SupplierForm onSuccess={() => setIsSupplierModalOpen(false)} onCancel={() => setIsSupplierModalOpen(false)} />
            </Modal>

            <Modal isOpen={isGrnModalOpen} onClose={() => setIsGrnModalOpen(false)} title="Receive Goods (GRN)" maxWidth="max-w-xl">
                <GrnForm onSuccess={() => setIsGrnModalOpen(false)} onCancel={() => setIsGrnModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default Purchase;
