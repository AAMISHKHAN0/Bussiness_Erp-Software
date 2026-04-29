import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '../../services/api';

const SupplierForm = ({ onSuccess, onCancel, initialData = null }) => {
    const queryClient = useQueryClient();
    const isEditing = !!initialData;

    const [formData, setFormData] = useState({
        name: '', company_name: '', contact_person: '', email: '', phone: '',
        address: '', city: '', country: '', tax_id: '',
        payment_terms: '', notes: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                company_name: initialData.company_name || '',
                contact_person: initialData.contact_person || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
                address: initialData.address || '',
                city: initialData.city || '',
                country: initialData.country || '',
                tax_id: initialData.tax_id || '',
                payment_terms: initialData.payment_terms || '',
                notes: initialData.notes || ''
            });
        }
    }, [initialData]);

    const mutation = useMutation({
        mutationFn: (data) => isEditing
            ? api.put(`/suppliers/${initialData.id}`, data)
            : api.post('/suppliers', data),
        onSuccess: (res) => {
            console.log('[SupplierForm] Supplier saved successfully:', res.data);
            // Refetch both keys to cover Purchase page and Vendor page
            queryClient.refetchQueries({ queryKey: ['purchase-data'] });
            queryClient.refetchQueries({ queryKey: ['suppliers'] });
            queryClient.refetchQueries({ queryKey: ['products'] });
            onSuccess();
        },
        onError: (err) => {
            console.error('[SupplierForm] Failed to save supplier:', err.response?.data || err.message);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier / Vendor Name *</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Tech Distributors Inc." />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Legal Entity Name" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Jane Smith" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="vendor@example.com" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="+1 234 567 8900" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax / VAT Number</label>
                    <input type="text" name="tax_id" value={formData.tax_id} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="e.g. US12345678" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                    <select name="payment_terms" value={formData.payment_terms} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white outline-none transition-all">
                        <option value="">-- Select Terms --</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 60">Net 60</option>
                        <option value="Due on Receipt">Due on Receipt</option>
                        <option value="Advance Payment">Advance Payment</option>
                    </select>
                </div>

                <div className="col-span-1 sm:col-span-2 space-y-4 border-t border-gray-100 pt-4 mt-2">
                    <h3 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Address Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="col-span-1 sm:col-span-2">
                            <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Street Address" />
                        </div>
                        <div>
                            <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="City / State" />
                        </div>
                        <div>
                            <input type="text" name="country" value={formData.country} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Country" />
                        </div>
                    </div>
                </div>

                <div className="col-span-1 sm:col-span-2 border-t border-gray-100 pt-4 mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                    <input type="text" name="notes" value={formData.notes} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Preferred supplier for..." />
                </div>
            </div>

            {/* Error Message */}
            {mutation.isError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                    {mutation.error.response?.data?.message || 'Failed to create supplier. Please try again.'}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition-colors">
                    Cancel
                </button>
                <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-lg transition-colors flex justify-center items-center">
                    {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Supplier'}
                </button>
            </div>
        </form>
    );
};

export default SupplierForm;
