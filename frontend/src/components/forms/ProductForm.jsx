import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useI18n } from '../../context/I18nContext';

const ProductForm = ({ onSuccess, onCancel, categories = [], suppliers = [], initialData = null }) => {
    const queryClient = useQueryClient();
    const { t } = useI18n();
    const isEditing = !!initialData;
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: initialData?.name || '', sku: initialData?.sku || '', category_id: initialData?.category_id || '', brand: initialData?.brand || '', description: initialData?.description || '',
        cost_price: initialData?.cost_price || '', base_price: initialData?.base_price || '', tax_rate: initialData?.tax_rate || '0',
        stock_quantity: initialData?.stock_quantity || '0', min_stock_level: initialData?.min_stock_level || '5', supplier_id: initialData?.supplier_id || '',
        barcode: initialData?.barcode || '', unit_of_measure: initialData?.unit_of_measure || 'pcs', is_active: initialData?.is_active ?? true, image_url: initialData?.image_url || ''
    });

    const mutation = useMutation({
        mutationFn: (productData) => isEditing ? api.put(`/products/${initialData.id}`, productData) : api.post('/products', productData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
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

    const handleImageUpload = (e) => {
        // Mock image upload
        setIsUploading(true);
        setTimeout(() => {
            setFormData(prev => ({ ...prev, image_url: 'https://placehold.co/400x400/e2e8f0/475569?text=Product+Image' }));
            setIsUploading(false);
        }, 1000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Format numbers before sending
        const payload = {
            ...formData,
            cost_price: Number(formData.cost_price) || 0,
            base_price: Number(formData.base_price) || 0,
            tax_rate: Number(formData.tax_rate) || 0,
            stock_quantity: Number(formData.stock_quantity) || 0,
            min_stock_level: Number(formData.min_stock_level) || 0,
            category_id: formData.category_id || null,
            supplier_id: formData.supplier_id || null
        };

        mutation.mutate(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="flex justify-center">
                <div className="relative group w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-500 overflow-hidden bg-gray-50 flex flex-col items-center justify-center transition-colors cursor-pointer" onClick={() => document.getElementById('product-image').click()}>
                    {isUploading ? (
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    ) : formData.image_url ? (
                        <img src={formData.image_url} alt="Product" className="w-full h-full object-cover" />
                    ) : (
                        <>
                            <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-primary-500 transition-colors" />
                            <span className="text-xs text-gray-500 mt-2 font-medium">{t('productForm.uploadImage')}</span>
                        </>
                    )}
                    <input type="file" id="product-image" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('productForm.productName')} {t('productForm.required')}</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" placeholder={t('productForm.productNamePlaceholder')} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('productForm.sku')}</label>
                    <input type="text" name="sku" value={formData.sku} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" placeholder={t('productForm.skuPlaceholder')} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('productForm.barcode')}</label>
                    <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" placeholder={t('productForm.barcodePlaceholder')} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.category')}</label>
                    <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white">
                        <option value="">{t('productForm.selectCategory')}</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('productForm.brand')}</label>
                    <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" placeholder={t('productForm.brandPlaceholder')} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('productForm.costPrice')}</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input type="number" step="0.01" name="cost_price" value={formData.cost_price} onChange={handleChange} className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" placeholder={t('productForm.pricePlaceholder')} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('productForm.sellingPrice')} {t('productForm.required')}</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input required type="number" step="0.01" name="base_price" value={formData.base_price} onChange={handleChange} className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" placeholder={t('productForm.pricePlaceholder')} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('productForm.initialStock')}</label>
                    <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" placeholder="0" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('productForm.lowStockAlert')}</label>
                    <input type="number" name="min_stock_level" value={formData.min_stock_level} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" placeholder={t('productForm.lowStockPlaceholder')} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('productForm.unit')}</label>
                    <select name="unit_of_measure" value={formData.unit_of_measure} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white">
                        <option value="pcs">{t('productForm.unitPcs')}</option>
                        <option value="kg">{t('productForm.unitKg')}</option>
                        <option value="box">{t('productForm.unitBox')}</option>
                        <option value="m">{t('productForm.unitM')}</option>
                        <option value="l">{t('productForm.unitL')}</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('productForm.taxPercent')}</label>
                    <div className="relative">
                        <input type="number" step="0.1" name="tax_rate" value={formData.tax_rate} onChange={handleChange} className="w-full pr-8 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" placeholder="0" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                </div>

                <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('vendors.supplier')}</label>
                    <select name="supplier_id" value={formData.supplier_id} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white">
                        <option value="">{t('productForm.selectSupplier')}</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.description')}</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none" placeholder={t('productForm.descriptionPlaceholder')} />
                </div>
            </div>

            {/* Error Message */}
            {mutation.isError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                    {mutation.error.response?.data?.message || t('productForm.errorMessage')}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition-colors">
                    {t('productForm.cancel')}
                </button>
                <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-lg transition-colors flex justify-center items-center">
                    {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : isEditing ? t('productForm.updateProduct') : t('productForm.saveProduct')}
                </button>
            </div>
        </form>
    );
};

export default ProductForm;
