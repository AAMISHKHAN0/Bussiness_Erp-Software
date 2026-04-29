import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, ListTree, ArrowRightLeft, Loader2, AlertCircle, Plus, Search, Download } from 'lucide-react';
import api from '../services/api';
import { exportToCSV } from '../utils/exportUtils';
import { useI18n } from '../context/I18nContext';
import Modal from '../components/common/Modal';
import ActionButtons from '../components/common/ActionButtons';
import ProductForm from '../components/forms/ProductForm';
import CategoryForm from '../components/forms/CategoryForm';
import StockForm from '../components/forms/StockForm';

const Inventory = () => {
    const [activeTab, setActiveTab] = useState('products');
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();
    const { t } = useI18n();

    const { data: inventoryData, isLoading, error } = useQuery({
        queryKey: ['inventory-data'],
        queryFn: async () => {
            const [prodRes, catRes, invRes] = await Promise.all([
                api.get('/products'),
                api.get('/categories'),
                api.get('/inventory')
            ]);
            return {
                products: prodRes.data.data || [],
                categories: catRes.data.data || [],
                inventory: invRes.data.data || []
            };
        },
    });

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);

    const deleteMutation = useMutation({
        mutationFn: ({ endpoint, id }) => api.delete(`${endpoint}/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
    });

    const handleExport = () => {
        if (!inventoryData) return;
        if (activeTab === 'products') exportToCSV(inventoryData.products, 'Products_Export');
        if (activeTab === 'categories') exportToCSV(inventoryData.categories, 'Categories_Export');
        if (activeTab === 'stock') exportToCSV(inventoryData.inventory, 'StockLedger_Export');
    };

    const filteredProducts = inventoryData?.products?.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const filteredCategories = inventoryData?.categories?.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const filteredInventory = inventoryData?.inventory?.filter(i =>
        i.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 relative z-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">{t('inventory.title')}</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">{t('inventory.subtitle')}</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={handleExport} className="btn-secondary flex items-center justify-center gap-2 whitespace-nowrap glass hover:bg-gray-50 transition-all">
                        <Download size={18} /> {t('inventory.export')}
                    </button>
                    <button
                        onClick={() => {
                            if (activeTab === 'products') { setEditingProduct(null); setIsProductModalOpen(true); }
                            if (activeTab === 'categories') { setEditingCategory(null); setIsCategoryModalOpen(true); }
                            if (activeTab === 'stock') setIsStockModalOpen(true);
                        }}
                        className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-primary-500/20"
                    >
                        <Plus size={18} />
                        {activeTab === 'products' ? t('inventory.addProduct') : activeTab === 'categories' ? t('inventory.addCategory') : t('inventory.addStock')}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 hide-scrollbar overflow-x-auto">
                <button onClick={() => setActiveTab('products')} className={`flex-shrink-0 px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'products' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <Package size={18} /> {t('inventory.products')}
                </button>
                <button onClick={() => setActiveTab('categories')} className={`flex-shrink-0 px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'categories' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <ListTree size={18} /> {t('inventory.categories')}
                </button>
                <button onClick={() => setActiveTab('stock')} className={`flex-shrink-0 px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'stock' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <ArrowRightLeft size={18} /> {t('inventory.stockLedger')}
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 glass p-4 rounded-2xl shadow-sm border border-white/40">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('inventory.searchPlaceholder', { tab: activeTab === 'products' ? t('inventory.products') : activeTab === 'categories' ? t('inventory.categories') : t('inventory.stockLedger') })} className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" />
                </div>
            </div>

            {/* Content Area */}
            <div className="glass rounded-2xl shadow-sm border border-white/40 min-h-[400px] overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        <p className="text-gray-500">{t('inventory.loading')}</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4 max-w-md mx-auto text-center p-6 glass-dark/5 rounded-2xl m-6 border border-white/20">
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2"><AlertCircle size={24} /></div>
                        <h3 className="text-lg font-medium text-gray-900">{t('inventory.databaseOffline')}</h3>
                        <p className="text-gray-500 text-sm">{t('inventory.databaseOfflineDesc')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {activeTab === 'products' && (
                            filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <div className="w-16 h-16 bg-white/50 glass rounded-2xl flex items-center justify-center border border-white/40"><Package size={32} className="text-gray-400" /></div>
                                    <h3 className="text-lg font-medium text-gray-900">{t('inventory.noProducts')}</h3>
                                    <p className="text-gray-500 text-sm">{t('inventory.noProductsDesc')}</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-bold border-b border-gray-100/50">
                                        <tr>
                                            <th className="px-6 py-4">{t('inventory.productName')}</th>
                                            <th className="px-6 py-4">{t('inventory.sku')}</th>
                                            <th className="px-6 py-4">{t('inventory.category')}</th>
                                            <th className="px-6 py-4">{t('inventory.unitPrice')}</th>
                                            <th className="px-6 py-4">{t('inventory.quantity')}</th>
                                            <th className="px-6 py-4 text-right">{t('inventory.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100/50 bg-white/30 backdrop-blur-sm">
                                        {filteredProducts.map(product => (
                                            <tr key={product.id} className="hover:bg-primary-50/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-semibold text-gray-900">{product.name}</div>
                                                    <div className="text-xs text-gray-500">{product.brand}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{product.sku}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{product.category_name || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${product.base_price}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${Number(product.quantity || 0) <= 0 ? 'bg-red-100 text-red-800' : Number(product.quantity || 0) <= Number(product.min_stock_level || 5) ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                                        {product.quantity || 0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <ActionButtons
                                                        onEdit={() => { 
                                                            setEditingProduct({
                                                                ...product,
                                                                stock_quantity: product.quantity || 0
                                                            }); 
                                                            setIsProductModalOpen(true); 
                                                        }}
                                                        onDelete={() => deleteMutation.mutate({ endpoint: '/products', id: product.id })}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}

                        {activeTab === 'categories' && (
                            filteredCategories.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <div className="w-16 h-16 bg-white/50 glass rounded-2xl flex items-center justify-center border border-white/40"><ListTree size={32} className="text-gray-400" /></div>
                                    <h3 className="text-lg font-medium text-gray-900">{t('inventory.noCategories')}</h3>
                                    <p className="text-gray-500 text-sm">{t('inventory.noCategoriesDesc')}</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-bold border-b border-gray-100/50">
                                        <tr>
                                            <th className="px-6 py-4">{t('inventory.categoryName')}</th>
                                            <th className="px-6 py-4">{t('inventory.parentCategory')}</th>
                                            <th className="px-6 py-4">{t('inventory.description')}</th>
                                            <th className="px-6 py-4 text-right">{t('inventory.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100/50 bg-white/30">
                                        {filteredCategories.map(category => (
                                            <tr key={category.id} className="hover:bg-primary-50/30 transition-colors">
                                                <td className="px-6 py-4 font-semibold text-gray-900">{category.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {category.parent_id ? inventoryData.categories.find(c => c.id === category.parent_id)?.name || category.parent_id : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{category.description || '-'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <ActionButtons
                                                        onEdit={() => { setEditingCategory(category); setIsCategoryModalOpen(true); }}
                                                        onDelete={() => deleteMutation.mutate({ endpoint: '/categories', id: category.id })}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}

                        {activeTab === 'stock' && (
                            filteredInventory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <div className="w-16 h-16 bg-white/50 glass rounded-2xl flex items-center justify-center border border-white/40"><ArrowRightLeft size={32} className="text-gray-400" /></div>
                                    <h3 className="text-lg font-medium text-gray-900">{t('inventory.noStock')}</h3>
                                    <p className="text-gray-500 text-sm">{t('inventory.noStockDesc')}</p>
                                </div>
                            ) : (
                                <table className="w__full text-left">
                                    <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-bold border-b border-gray-100/50">
                                        <tr>
                                            <th className="px-6 py-4">{t('inventory.productName')}</th>
                                            <th className="px-6 py-4">{t('inventory.sku')}</th>
                                            <th className="px-6 py-4">{t('inventory.branch')}</th>
                                            <th className="px-6 py-4">{t('inventory.quantity')}</th>
                                            <th className="px-6 py-4">{t('inventory.lastUpdated')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100/50 bg-white/30">
                                        {filteredInventory.map(inv => (
                                            <tr key={inv.id} className="hover:bg-primary-50/30 transition-colors">
                                                <td className="px-6 py-4 font-semibold text-gray-900">{inv.product_name}</td>
                                                <td className="px-6 py-4 text-sm font-mono text-gray-600">{inv.sku}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{inv.branch_name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${Number(inv.quantity) <= Number(inv.min_stock_level) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                        {inv.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {inv.last_updated ? new Date(inv.last_updated).toLocaleDateString() : '-'}
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

            {/* Modals */}
            <Modal isOpen={isProductModalOpen} onClose={() => { setIsProductModalOpen(false); setEditingProduct(null); }} title={editingProduct ? t('productForm.updateProduct') : t('inventory.addProduct')} maxWidth="max-w-2xl">
                <ProductForm
                    key={editingProduct?.id || 'new'}
                    onSuccess={() => { setIsProductModalOpen(false); setEditingProduct(null); }}
                    onCancel={() => { setIsProductModalOpen(false); setEditingProduct(null); }}
                    categories={inventoryData?.categories || []}
                    suppliers={[]}
                    initialData={editingProduct}
                />
            </Modal>

            <Modal isOpen={isCategoryModalOpen} onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }} title={editingCategory ? t('productForm.updateProduct') : t('inventory.addCategory')} maxWidth="max-w-md">
                <CategoryForm
                    key={editingCategory?.id || 'new'}
                    onSuccess={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
                    onCancel={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
                    categories={inventoryData?.categories || []}
                    initialData={editingCategory}
                />
            </Modal>

            <Modal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} title={t('inventory.stockLedger')} maxWidth="max-w-xl">
                <StockForm onSuccess={() => setIsStockModalOpen(false)} onCancel={() => setIsStockModalOpen(false)} products={inventoryData?.products || []} />
            </Modal>
        </div>
    );
};

export default Inventory;
