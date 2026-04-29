import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '../../services/api';

const AccountForm = ({ onSuccess, onCancel }) => {
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        code: '', name: '', type: 'Asset', category: 'Current Asset', description: ''
    });

    const mutation = useMutation({
        mutationFn: (newAccount) => api.post('/accounting/accounts', newAccount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['accounting-data'] });
            onSuccess();
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Code *</label>
                    <input required type="text" name="code" value={formData.code} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. 1001" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Cash on Hand" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Type *</label>
                    <select required name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white outline-none">
                        <option value="Asset">Asset</option>
                        <option value="Liability">Liability</option>
                        <option value="Equity">Equity</option>
                        <option value="Revenue">Revenue</option>
                        <option value="Expense">Expense</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <input required type="text" name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. Current Asset" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none" placeholder="Account for recording..." />
                </div>
            </div>

            {mutation.isError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                    {mutation.error.response?.data?.message || 'Failed to create account.'}
                </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition-colors">
                    Cancel
                </button>
                <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-lg transition-colors flex justify-center items-center">
                    {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Account'}
                </button>
            </div>
        </form>
    );
};

export default AccountForm;
