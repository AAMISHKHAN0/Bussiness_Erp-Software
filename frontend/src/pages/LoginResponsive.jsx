import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import AuthShowcase from '../components/common/AuthShowcase';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { logoUrl } from '../utils/assets';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

const showcaseStats = [
    { label: 'Modules', value: '12+' },
    { label: 'Reports', value: '50+' },
    { label: 'Uptime', value: '99.9%' },
];

const LoginResponsive = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();
    const { t } = useI18n();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Check for session expired or other query params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sessionStatus = params.get('session');
        const activated = params.get('activated');
        
        if (sessionStatus === 'expired') {
            setError('Your session has expired. Please sign in again.');
        } else if (activated === 'true') {
            // License was just activated
        }
        
        // Clean up URL
        if (sessionStatus || activated) {
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            let message = 'Login failed. Please try again.';
            
            if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
                message = 'Cannot connect to server. Please check your internet connection or try again later.';
            } else if (err.response?.status === 401) {
                message = 'Invalid email or password. Please try again.';
            } else if (err.response?.status === 403) {
                message = 'Your account has been deactivated. Please contact an administrator.';
            } else if (err.response?.data?.message) {
                message = err.response.data.message;
            }
            
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-shell">
            <AuthShowcase
                title="Business Management"
                accent="Made Simple."
                description="Manage inventory, sales, accounting, HR, and analytics from one workspace with a layout that scales cleanly from compact laptops to wide screens."
                stats={showcaseStats}
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
                            <h2 className="text-[clamp(1.75rem,0.9vw+1.45rem,2.25rem)] font-bold text-gray-900">{t('auth.welcomeBack')}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-gray-500 sm:text-base">
                                {t('auth.signInHelp')}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 animate-fadeIn" role="alert" id="login-error">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                            <div>
                                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                                    {t('auth.emailAddress')}
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@company.com"
                                    className="input-field"
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                                    {t('auth.password')}
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="input-field pr-10"
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        id="remember-me"
                                    />
                                    <span className="text-gray-600">{t('auth.rememberMe')}</span>
                                </label>
                                <a href="#" className="font-medium text-primary-600 hover:text-primary-700">
                                    {t('auth.forgotPassword')}
                                </a>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary flex w-full items-center justify-center gap-2"
                                id="login-btn"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        {t('auth.signingIn')}
                                    </>
                                ) : (
                                    t('auth.signIn')
                                )}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-xs text-gray-400">
                            {t('auth.accountHelp')}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LoginResponsive;
