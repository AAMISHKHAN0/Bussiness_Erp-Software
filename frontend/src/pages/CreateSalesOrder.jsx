import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Save, FileText, Loader2 } from 'lucide-react';
import api from '../services/api';

const CreateSalesOrder = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Fetch master data needed for the form
    const { data: customers = [] } = useQuery({
        queryKey: ['customers'],
        queryFn: () => api.get('/customers').then(res => res.data.data)
    });

    const { data: products = [] } = useQuery({
        queryKey: ['products'],
        queryFn: () => api.get('/products').then(res => res.data.data)
    });

    // Form State
    const [customerId, setCustomerId] = useState('');
    const [status, setStatus] = useState('Pending');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([
        { id: Date.now(), product_id: '', quantity: 1, unit_price: 0, tax: 0, discount: 0 }
    ]);

    // Derived totals
    const totals = useMemo(() => {
        let subtotal = 0;
        let tax = 0;
        let discount = 0;

        items.forEach(item => {
            const rowSubtotal = (item.quantity * item.unit_price) || 0;
            const rowTax = rowSubtotal * ((item.tax || 0) / 100);
            const rowDiscount = Number(item.discount || 0);

            subtotal += rowSubtotal;
            tax += rowTax;
            discount += rowDiscount;
        });

        return {
            subtotal,
            tax,
            discount,
            grandTotal: (subtotal + tax) - discount
        };
    }, [items]);

    // Mutations
    const orderMutation = useMutation({
        mutationFn: (newOrder) => api.post('/sales/orders', newOrder),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            navigate('/sales');
        }
    });

    // Handlers
    const addItem = () => {
        setItems(prev => [...prev, { id: Date.now(), product_id: '', quantity: 1, unit_price: 0, tax: 0, discount: 0 }]);
    };

    const removeItem = (id) => {
        if (items.length === 1) return; // Must have at least one item
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                // Auto-fill price if product changes
                if (field === 'product_id') {
                    const selectedProduct = products.find(p => p.id === value);
                    if (selectedProduct) {
                        updated.unit_price = selectedProduct.base_price;
                    }
                }
                return updated;
            }
            return item;
        }));
    };

    const handleSaveOrder = (e) => {
        e.preventDefault();

        // Validation
        if (!customerId) return alert("Please select a customer.");
        if (items.some(i => !i.product_id || i.quantity <= 0)) return alert("Please ensure all items have a product and valid quantity.");

        const payload = {
            customer_id: customerId,
            branch_id: '1',
            status,
            items: items.map(i => ({
                product_id: i.product_id,
                quantity: Number(i.quantity),
                unit_price: Number(i.unit_price),
                tax: Number(i.tax),
                discount: Number(i.discount)
            })),
            notes
        };

        orderMutation.mutate(payload);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Sales Order</h1>
                    <p className="text-sm text-gray-500 mt-1">Draft a new sales order for a customer.</p>
                </div>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-6">
                {/* Customer Information */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">1. Customer Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer *</label>
                            <select required value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white">
                                <option value="">-- Choose Customer --</option>
                                {customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white">
                                <option value="Pending">Pending</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                            <span className="text-xs text-gray-400 mt-1 block">Current status of the sales order.</span>
                        </div>
                    </div>
                </div>

                {/* Order Information */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-semibold text-gray-900">2. Order Items</h2>
                        <button type="button" onClick={addItem} className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                            <Plus size={16} /> Add Item
                        </button>
                    </div>

                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 border-b border-gray-100 pb-2">
                        <div className="col-span-4">Product</div>
                        <div className="col-span-2">Quantity</div>
                        <div className="col-span-2">Unit Price</div>
                        <div className="col-span-2">Discount Amount</div>
                        <div className="col-span-1 text-right">Total</div>
                        <div className="col-span-1 text-center">Action</div>
                    </div>

                    {/* Items */}
                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-gray-50 p-3 md:p-0 md:bg-transparent rounded-lg">
                                {/* Product selector */}
                                <div className="col-span-1 md:col-span-4">
                                    <label className="md:hidden block text-xs font-medium text-gray-500 mb-1">Product</label>
                                    <select
                                        required
                                        value={item.product_id}
                                        onChange={e => handleItemChange(item.id, 'product_id', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                                    >
                                        <option value="">Select Product...</option>
                                        {products?.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                                    </select>
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="md:hidden block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                                    <input type="number" min="1" required value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" />
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="md:hidden block text-xs font-medium text-gray-500 mb-1">Unit Price</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                        <input type="number" step="0.01" value={item.unit_price} onChange={e => handleItemChange(item.id, 'unit_price', e.target.value)} className="w-full pl-6 pr-3 py-2 border border-gray-200 rounded-md text-sm" />
                                    </div>
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="md:hidden block text-xs font-medium text-gray-500 mb-1">Discount</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                        <input type="number" step="0.01" value={item.discount} onChange={e => handleItemChange(item.id, 'discount', e.target.value)} className="w-full pl-6 pr-3 py-2 border border-gray-200 rounded-md text-sm" />
                                    </div>
                                </div>

                                <div className="col-span-1 text-right font-medium text-gray-900">
                                    <label className="md:hidden block text-xs font-medium text-gray-500 mb-1 text-left">Line Total</label>
                                    ${((item.quantity * item.unit_price) - item.discount).toFixed(2)}
                                </div>

                                <div className="col-span-1 flex justify-end md:justify-center">
                                    <button type="button" onClick={() => removeItem(item.id)} disabled={items.length === 1} className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 border-t border-gray-100 pt-4">
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Order notes or special instructions..." rows={2} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 resize-none" />
                    </div>
                </div>

                {/* Summary & Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="flex gap-3 w-full md:w-auto">
                        <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 font-medium rounded-xl transition-colors w-full md:w-auto">
                            Cancel
                        </button>
                        <button type="submit" disabled={orderMutation.isPending} className="px-6 py-2 text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-xl shadow-sm transition-colors flex justify-center items-center gap-2 w-full md:w-auto">
                            {orderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                            Save Order
                        </button>
                        <button type="button" className="px-6 py-2 border border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100 font-medium rounded-xl transition-colors flex justify-center items-center gap-2 w-full md:w-auto">
                            <FileText size={16} />
                            Save & Invoice
                        </button>
                    </div>

                    <div className="w-full md:w-72 bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span>${totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Discount</span>
                            <span className="text-red-500">-${totals.discount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                            <span>Grand Total</span>
                            <span>${totals.grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateSalesOrder;
