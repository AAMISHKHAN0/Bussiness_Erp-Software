import { useState, useEffect } from 'react';
import { Loader2, Upload, Image } from 'lucide-react';

const SettingsModal = ({ onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        currency: 'USD',
        timezone: 'UTC',
        theme: 'System',
        notifications: true
    });
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(localStorage.getItem('erp_logo') || null);
    const [isSaving, setIsSaving] = useState(false);

    // Load saved settings on mount
    useEffect(() => {
        const saved = localStorage.getItem('erp_settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setFormData(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error('Failed to parse settings:', e);
            }
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('Logo file size must be less than 2MB');
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }
            setLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSaving(true);
        // Save settings to local storage
        setTimeout(() => {
            localStorage.setItem('erp_settings', JSON.stringify(formData));
            if (logoPreview) {
                localStorage.setItem('erp_logo', logoPreview);
            }
            setIsSaving(false);
            onSuccess();
            // Reload page to apply changes
            window.location.reload();
        }, 600);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload Section */}
            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="w-20 h-20 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                    ) : (
                        <Image className="w-8 h-8 text-gray-400" />
                    )}
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
                    <p className="text-xs text-gray-500 mb-2">Upload PNG, JPG or SVG (max 2MB)</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        Upload Logo
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">System Currency</label>
                    <select name="currency" value={formData.currency} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white outline-none">
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="PKR">PKR (₨)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                    <select name="timezone" value={formData.timezone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white outline-none">
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="EST">EST (Eastern Standard Time)</option>
                        <option value="PST">PST (Pacific Standard Time)</option>
                        <option value="IST">IST (Indian Standard Time)</option>
                        <option value="PKT">PKT (Pakistan Standard Time)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Theme Preference</label>
                    <select name="theme" value={formData.theme} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white outline-none">
                        <option value="System">System Default</option>
                        <option value="Light">Light Mode</option>
                        <option value="Dark">Dark Mode</option>
                    </select>
                </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
                    <p className="text-xs text-gray-500">Receive alerts for low stock and new orders.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="notifications" checked={formData.notifications} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition-colors">
                    Cancel
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-lg transition-colors flex justify-center items-center">
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Preferences'}
                </button>
            </div>
        </form>
    );
};

export default SettingsModal;
