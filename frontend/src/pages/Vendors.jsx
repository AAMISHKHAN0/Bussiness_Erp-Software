import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Phone, Mail, Package, DollarSign, Plus, Search, Download, Loader2, AlertCircle, Eye, X, Star, TrendingUp } from 'lucide-react';
import api from '../services/api';
import { exportToCSV } from '../utils/exportUtils';
import Modal from '../components/common/Modal';
import ActionButtons from '../components/common/ActionButtons';
import SupplierForm from '../components/forms/SupplierForm';

const Vendors = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const { data: suppliers = [], isLoading, error } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () => api.get('/suppliers').then(res => {
            console.log('[VendorsPage] Data received:', res.data.data);
            return res.data.data || [];
        }),
    });

    const { data: purchaseOrders = [] } = useQuery({
        queryKey: ['purchase-orders'],
        queryFn: () => api.get('/purchases/orders').then(res => res.data.data || []),
    });

    const { data: products = [] } = useQuery({
        queryKey: ['products'],
        queryFn: () => api.get('/products').then(res => res.data.data || []),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/suppliers/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    });

    const filtered = suppliers.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getSupplierStats = (supplierId) => {
        const orders = purchaseOrders.filter(o => o.supplier_id == supplierId);
        const totalPurchased = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        const suppliedProducts = products.filter(p => p.supplier_id == supplierId).length;
        return { orderCount: orders.length, totalPurchased, suppliedProducts };
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Track suppliers, purchase history, and vendor performance.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={() => exportToCSV(suppliers, 'Vendors_Export')} className="flex items-center justify-center gap-2 whitespace-nowrap bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 font-medium transition-colors">
                        <Download size={18} /> Export
                    </button>
                    <button onClick={() => { setEditingSupplier(null); setIsModalOpen(true); }} className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap">
                        <Plus size={18} /> Add Vendor
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Vendors</p>
                            <h3 className="text-2xl font-black text-gray-900 mt-1">{suppliers.length}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Truck size={22} /></div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Purchase Orders</p>
                            <h3 className="text-2xl font-black text-gray-900 mt-1">{purchaseOrders.length}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Package size={22} /></div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Purchases</p>
                            <h3 className="text-2xl font-black text-gray-900 mt-1">
                                ${purchaseOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={22} /></div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Supplied Products</p>
                            <h3 className="text-2xl font-black text-gray-900 mt-1">{products.filter(p => p.supplier_id).length}</h3>
                        </div>
                        <div className="p-3 bg-violet-50 text-violet-600 rounded-xl"><Star size={22} /></div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search vendors..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
            </div>

            {/* Vendor Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        <p className="text-gray-500">Loading vendors...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <AlertCircle className="w-12 h-12 text-red-400" />
                        <p className="text-gray-500">Failed to load vendors</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <Truck className="w-16 h-16 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900">No vendors found</h3>
                        <p className="text-gray-500 text-sm">Add your first vendor to start tracking.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Vendor</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Orders</th>
                                    <th className="px-6 py-4">Total Purchased</th>
                                    <th className="px-6 py-4">Products</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(supplier => {
                                    const stats = getSupplierStats(supplier.id);
                                    return (
                                        <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center font-bold text-orange-700 text-sm">
                                                        {supplier.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{supplier.name}</p>
                                                        <p className="text-xs text-gray-400">{supplier.address || 'No address'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600"><Mail size={13} className="text-gray-400" /> {supplier.email || '-'}</div>
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600"><Phone size={13} className="text-gray-400" /> {supplier.phone || '-'}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                                    {stats.orderCount} POs
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-900">${stats.totalPurchased.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700">
                                                    {stats.suppliedProducts} items
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => setSelectedSupplier(supplier)} className="p-2 text-gray-400 hover:text-primary-600 transition-colors"><Eye size={16} /></button>
                                                    <ActionButtons
                                                        onEdit={() => { setEditingSupplier(supplier); setIsModalOpen(true); }}
                                                        onDelete={() => deleteMutation.mutate(supplier.id)}
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

            {/* Supplier Detail Drawer */}
            {selectedSupplier && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end" onClick={() => setSelectedSupplier(null)}>
                    <div className="w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto animate-slideInRight" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-900">Vendor Profile</h2>
                            <button onClick={() => setSelectedSupplier(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-black mx-auto shadow-lg shadow-orange-500/20">
                                    {selectedSupplier.name?.charAt(0)}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mt-4">{selectedSupplier.name}</h3>
                                <p className="text-sm text-gray-500">{selectedSupplier.email || 'No email'}</p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Details</h4>
                                <div className="flex items-center gap-3 text-sm"><Mail size={16} className="text-gray-400" /><span>{selectedSupplier.email || '-'}</span></div>
                                <div className="flex items-center gap-3 text-sm"><Phone size={16} className="text-gray-400" /><span>{selectedSupplier.phone || '-'}</span></div>
                            </div>

                            {/* Performance Insights */}
                            <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-4 border border-orange-100">
                                <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 flex items-center gap-2"><TrendingUp size={14} /> Performance</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-2xl font-black text-gray-900">{getSupplierStats(selectedSupplier.id).orderCount}</p>
                                        <p className="text-xs text-gray-500">Purchase Orders</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-gray-900">${getSupplierStats(selectedSupplier.id).totalPurchased.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">Total Purchased</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-gray-900">{getSupplierStats(selectedSupplier.id).suppliedProducts}</p>
                                        <p className="text-xs text-gray-500">Products Supplied</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-emerald-600">A+</p>
                                        <p className="text-xs text-gray-500">Rating</p>
                                    </div>
                                </div>
                            </div>

                            {/* Purchase History */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Purchase History</h4>
                                {purchaseOrders.filter(o => o.supplier_id == selectedSupplier.id).length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">No purchase orders yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {purchaseOrders.filter(o => o.supplier_id == selectedSupplier.id).map(order => (
                                            <div key={order.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100">
                                                <div>
                                                    <p className="font-medium text-sm text-orange-600">{order.order_number}</p>
                                                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <p className="font-bold text-sm">${parseFloat(order.total_amount || 0).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingSupplier(null); }} title={editingSupplier ? 'Edit Vendor' : 'Add New Vendor'} maxWidth="max-w-2xl">
                <SupplierForm
                    key={editingSupplier?.id || 'new'}
                    onSuccess={() => { setIsModalOpen(false); setEditingSupplier(null); }}
                    onCancel={() => { setIsModalOpen(false); setEditingSupplier(null); }}
                    initialData={editingSupplier}
                />
            </Modal>
        </div>
    );
};

export default Vendors;
