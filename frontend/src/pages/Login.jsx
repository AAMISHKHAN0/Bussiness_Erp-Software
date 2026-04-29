import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { logoUrl } from '../utils/assets';
import AuthShowcase from '../components/common/AuthShowcase';

const showcaseStats = [
    { label: 'Modules', value: '12+' },
    { label: 'Reports', value: '50+' },
    { label: 'Uptime', value: '99.9%' },
];

const Login = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if already authenticated
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
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side — Branding */}
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
                        Business Management
                        <br />
                        <span className="text-primary-300">Made Simple.</span>
                    </h2>

                    <p className="text-lg text-primary-200 leading-relaxed max-w-md">
                        Manage your entire business operations — inventory, sales, accounting, HR, and analytics
                        — all in one powerful platform.
                    </p>

                    <div className="flex gap-6 mt-12">
                        {[
                            { label: 'Modules', value: '12+' },
                            { label: 'Reports', value: '50+' },
                            { label: 'Uptime', value: '99.9%' },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center">
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-sm text-primary-300">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right side — Login form */}
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
                            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                            <p className="text-gray-500 mt-2">Sign in to your account to continue</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-fadeIn" role="alert" id="login-error">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email Address
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
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Password
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
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        id="remember-me"
                                    />
                                    <span className="text-sm text-gray-600">Remember me</span>
                                </label>
                                <a href="#" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                    Forgot password?
                                </a>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                                id="login-btn"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <p className="text-center text-xs text-gray-400 mt-6">
                            Contact your administrator if you need an account
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
