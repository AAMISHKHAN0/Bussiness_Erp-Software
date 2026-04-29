import { useState } from 'react';
import { useLicense } from '../context/LicenseContext';
import { KeyRound, Building2, Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { logoUrl } from '../utils/assets';

const ActivationPage = () => {
    const { activateLicense, activating } = useLicense();
    const [key, setKey] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleActivate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!key.trim()) {
            setError('Please enter an activation key.');
            return;
        }

        const result = await activateLicense(key.trim());
        if (result.success) {
            setSuccess(result.message);
            setKey('');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side — Branding (matches Login page) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-primary-300/10 rounded-full blur-2xl" />
                </div>

                <div className="relative z-10 flex flex-col justify-center px-16">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 overflow-hidden">
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">ERP System</h1>
                    </div>

                    <h2 className="text-5xl font-extrabold text-white leading-tight mb-6">
                        Software
                        <br />
                        <span className="text-primary-300">Activation.</span>
                    </h2>

                    <p className="text-lg text-primary-200 leading-relaxed max-w-md">
                        Enter your license key to unlock full access to all modules — inventory, sales, accounting, HR, and analytics.
                    </p>

                    <div className="flex gap-6 mt-12">
                        {[
                            { label: '1 Day', prefix: 'DAY-' },
                            { label: '1 Month', prefix: 'MON-' },
                            { label: '3 Months', prefix: 'QTR-' },
                            { label: '1 Year', prefix: 'YER-' },
                        ].map((tier) => (
                            <div key={tier.label} className="text-center">
                                <p className="text-xl font-bold text-white">{tier.label}</p>
                                <p className="text-xs text-primary-300 font-mono">{tier.prefix}****</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right side — Activation form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-surface-dark">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center overflow-hidden">
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">ERP System</h1>
                    </div>

                    <div className="bg-white rounded-2xl shadow-card p-8 border border-gray-100">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Activate License</h2>
                            <p className="text-gray-500 mt-2">Enter your key to unlock full access</p>
                        </div>

                        {success && (
                            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm animate-fadeIn flex items-center gap-2">
                                <CheckCircle size={16} />
                                <span>{success}</span>
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-fadeIn flex items-center gap-2" role="alert">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleActivate} className="space-y-5">
                            <div>
                                <label htmlFor="activation-key-input" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Activation Key
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <KeyRound size={18} />
                                    </div>
                                    <input
                                        id="activation-key-input"
                                        type="text"
                                        value={key}
                                        onChange={(e) => setKey(e.target.value.toUpperCase())}
                                        placeholder="XXX-XXXX-XXXX-XXXX"
                                        className="input-field pl-10 font-mono tracking-wider"
                                        autoComplete="off"
                                        spellCheck="false"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={activating}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                                id="activate-btn"
                            >
                                {activating ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Validating...
                                    </>
                                ) : (
                                    <>
                                        <Zap size={18} />
                                        Activate License
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-center text-xs text-gray-400 mt-6">
                            Contact your administrator for activation keys
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivationPage;
