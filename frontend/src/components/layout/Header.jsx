import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useLicense } from '../../context/LicenseContext';
import {
    Menu,
    Search,
    ChevronDown,
    User,
    LogOut,
    Settings,
    Clock,
} from 'lucide-react';
import Modal from '../common/Modal';
import SettingsModal from '../forms/SettingsModal';
import NotificationCenter from '../common/NotificationCenter';
import LanguageSwitcher from '../common/LanguageSwitcher';

const Header = ({ onMenuToggle }) => {
    const { user, logout } = useAuth();
    const { t } = useI18n();
    const { tier, remainingFormatted } = useLicense();
    const [showProfile, setShowProfile] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const profileRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfile(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-gray-200/50 px-4 py-2 transition-all duration-300 glass lg:px-6">
            {/* Left side */}
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <button
                    onClick={onMenuToggle}
                    className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    id="menu-toggle"
                >
                    <Menu size={20} />
                </button>

                {/* Search */}
                <div className="hidden min-w-0 items-center gap-2 rounded-xl bg-gray-100/50 px-3 py-2 md:flex md:w-[min(26rem,42vw)]">
                    <Search size={16} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('header.searchPlaceholder')}
                        className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-full"
                        id="global-search"
                    />
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3">
                <LanguageSwitcher compact />

                {/* License Timer */}
                {tier && (
                    <div className="hidden items-center gap-1.5 rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 to-violet-50 px-3 py-1.5 sm:flex" title={t('header.licenseTitle', { tier })}>
                        <Clock size={14} className="text-primary-600" />
                        <span className="text-xs font-bold text-primary-700 tabular-nums">{remainingFormatted}</span>
                    </div>
                )}

                {/* Dynamic Notification Center */}
                <NotificationCenter />

                {/* Profile dropdown */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setShowProfile(!showProfile)}
                        className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-gray-100/50"
                        id="profile-btn"
                    >
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <span className="text-white text-sm font-semibold">
                                {user?.name?.charAt(0) || 'A'}
                            </span>
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-medium text-gray-700">{user?.name || 'Admin'}</p>
                            <p className="text-xs text-gray-500">{user?.role || t('header.superAdmin')}</p>
                        </div>
                        <ChevronDown size={14} className="hidden md:block text-gray-400" />
                    </button>

                    {/* Dropdown */}
                    {showProfile && (
                        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-200/50 bg-white py-2 shadow-xl animate-fadeIn glass">
                            <div className="px-4 py-3 border-b border-gray-100/50">
                                <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                            </div>
                            <div className="py-1">
                                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 transition-colors">
                                    <User size={16} className="text-gray-400" />
                                    {t('header.myProfile')}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowProfile(false);
                                        setIsSettingsModalOpen(true);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 transition-colors"
                                >
                                    <Settings size={16} className="text-gray-400" />
                                    {t('header.settings')}
                                </button>
                            </div>
                            <div className="border-t border-gray-100/50 pt-1">
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    id="logout-btn"
                                >
                                    <LogOut size={16} />
                                    {t('header.signOut')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Settings Modal */}
            <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title={t('header.globalSettings')} maxWidth="max-w-xl">
                <SettingsModal onSuccess={() => setIsSettingsModalOpen(false)} onCancel={() => setIsSettingsModalOpen(false)} />
            </Modal>
        </header>
    );
};

export default Header;
