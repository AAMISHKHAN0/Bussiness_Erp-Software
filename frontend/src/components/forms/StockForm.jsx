import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '../../services/api';

const StockForm = ({ onSuccess, onCancel, products = [] }) => {
    const queryClient = useQueryClient();
    const [successMsg, setSuccessMsg] = useState('');

    const [formData, setFormData] = useState({
        product_id: '', branch_id: '1', movement_type: 'IN',
        quantity: '', reference_type: 'Manual', reference_id: '', notes: ''
    });

    const mutation = useMutation({
        mutationFn: (newMovement) => api.post('/inventory/movement', newMovement),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            setSuccessMsg(`Stock ${variables.movement_type === 'IN' ? 'added' : variables.movement_type === 'OUT' ? 'removed' : 'adjusted'}: ${variables.quantity} units`);
            setTimeout(() => onSuccess(), 1200);
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({
            ...formData,
            quantity: Number(formData.quantity)
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                    <select required name="product_id" value={formData.product_id} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white">
                        <option value="">Select Product to Adjust</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type</label>
                        <select name="movement_type" value={formData.movement_type} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white">
                            <option value="IN">Add Stock</option>
                            <option value="OUT">Remove Stock</option>
                            <option value="ADJUSTMENT">Adjustment</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                        <input required type="number" min="1" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" placeholder="10" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number / Reason</label>
                    <input type="text" name="notes" value={formData.notes} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" placeholder="e.g. Broken in transit, Initial count..." />
                </div>
            </div>

            {/* Success Message */}
            {successMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100 animate-fadeIn">
                    ✓ {successMsg}
                </div>
            )}

            {/* Error Message */}
            {mutation.isError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                    {mutation.error.response?.data?.message || 'Failed to update stock. Please try again.'}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition-colors">
                    Cancel
                </button>
                <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-lg transition-colors flex justify-center items-center">
                    {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Adjustment'}
                </button>
            </div>
        </form>
    );
};

export default StockForm;
