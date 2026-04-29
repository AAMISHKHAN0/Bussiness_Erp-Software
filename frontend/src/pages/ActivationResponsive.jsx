import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, KeyRound, Loader2, Zap } from 'lucide-react';
import AuthShowcase from '../components/common/AuthShowcase';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { useI18n } from '../context/I18nContext';
import { useLicense } from '../context/LicenseContext';
import { logoUrl } from '../utils/assets';

const activationTiers = [
    { label: '1 Day', value: 'DAY-*' },
    { label: '1 Month', value: 'MON-*' },
    { label: '3 Months', value: 'QTR-*' },
    { label: '1 Year', value: 'YER-*' },
];

const ActivationResponsive = () => {
    const navigate = useNavigate();
    const { activateLicense, activating, isLicenseActive } = useLicense();
    const { t } = useI18n();
    const [key, setKey] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [redirectCountdown, setRedirectCountdown] = useState(0);

    // Auto-redirect to login when license becomes active
    useEffect(() => {
        if (isLicenseActive && redirectCountdown === 0) {
            setRedirectCountdown(3);
        }
    }, [isLicenseActive]);

    useEffect(() => {
        if (redirectCountdown > 0) {
            const timer = setTimeout(() => {
                if (redirectCountdown === 1) {
                    navigate('/login?activated=true');
                } else {
                    setRedirectCountdown(redirectCountdown - 1);
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [redirectCountdown, navigate]);

    const handleActivate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!key.trim()) {
            setError('Please enter an activation key.');
            return;
        }

        try {
            const result = await activateLicense(key.trim());
            if (result.success) {
                setSuccess(`${result.message} Redirecting to login in 3 seconds...`);
                setKey('');
                setRedirectCountdown(3);
            } else {
                setError(result.message);
            }
        } catch (err) {
            let message = 'Activation failed. Please try again.';
            
            if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
                message = 'Cannot connect to server. Please check your internet connection or try again later.';
            } else if (err.response?.data?.message) {
                message = err.response.data.message;
            }
            
            setError(message);
        }
    };

    return (
        <div className="auth-shell">
            <AuthShowcase
                title="Software"
                accent="Activation."
                description="Enter your license key to unlock the full workspace. The hero blur now scales with the viewport so it stays visible on large fullscreen displays as well."
                stats={activationTiers}
            />

            <section className="auth-form-panel">
                <div className="w-full max-w-lg">
                    <div className="mb-4 flex justify-end">
                        <LanguageSwitcher />
                    </div>

                    <div className="auth-mobile-brand">
                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary-500 to-primary-700">
                            <img src={logoUrl} alt="ERP logo" className="h-full w-full object-cover" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">ERP System</h1>
                    </div>

                    <div className="auth-form-card">
                        <div className="mb-8 text-center">
                            <h2 className="text-[clamp(1.75rem,0.9vw+1.45rem,2.25rem)] font-bold text-gray-900">{t('auth.activateLicense')}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-gray-500 sm:text-base">
                                {t('auth.activateHelp')}
                            </p>
                        </div>

                        {success && (
                            <div className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 animate-fadeIn">
                                <CheckCircle size={16} />
                                <span>{success} {redirectCountdown > 0 && `(${redirectCountdown})`}</span>
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 animate-fadeIn" role="alert">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleActivate} className="space-y-5 sm:space-y-6">
                            <div>
                                <label htmlFor="activation-key-input" className="mb-1.5 block text-sm font-medium text-gray-700">
                                    {t('auth.activationKey')}
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
                                        className="input-field pl-10 font-mono tracking-[0.25em]"
                                        autoComplete="off"
                                        spellCheck="false"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={activating}
                                className="btn-primary flex w-full items-center justify-center gap-2"
                                id="activate-btn"
                            >
                                {activating ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        {t('auth.validating')}
                                    </>
                                ) : (
                                    <>
                                        <Zap size={18} />
                                        {t('auth.activateButton')}
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-xs text-gray-400">
                            {t('auth.activationSupport')}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ActivationResponsive;
