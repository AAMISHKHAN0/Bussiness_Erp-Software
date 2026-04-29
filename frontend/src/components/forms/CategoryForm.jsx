import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '../../services/api';

const CategoryForm = ({ onSuccess, onCancel, categories = [], initialData = null }) => {
    const queryClient = useQueryClient();
    const isEditing = !!initialData;

    const [formData, setFormData] = useState({
        name: initialData?.name || '', description: initialData?.description || '', parent_id: initialData?.parent_id || '', is_active: initialData?.is_active ?? true
    });

    const mutation = useMutation({
        mutationFn: (catData) => isEditing ? api.put(`/categories/${initialData.id}`, catData) : api.post('/categories', catData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
            onSuccess();
        }
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            parent_id: formData.parent_id || null
        };
        mutation.mutate(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" placeholder="e.g. Electronics" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                    <select name="parent_id" value={formData.parent_id} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white">
                        <option value="">None (Top Level)</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none" placeholder="Description of the category..." />
                </div>
            </div>

            {/* Error Message */}
            {mutation.isError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                    {mutation.error.response?.data?.message || 'Failed to create category. Please try again.'}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition-colors">
                    Cancel
                </button>
                <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-lg transition-colors flex justify-center items-center">
                    {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : isEditing ? 'Update Category' : 'Save Category'}
                </button>
            </div>
        </form>
    );
};

export default CategoryForm;
