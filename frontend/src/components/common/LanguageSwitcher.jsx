import { Languages } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

const LanguageSwitcher = ({ compact = false, className = '' }) => {
    const { language, setLanguage, languages, t } = useI18n();

    return (
        <label className={`flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 ${className}`}>
            <Languages size={16} className="text-gray-400" />
            {!compact && <span className="hidden text-xs font-medium text-gray-500 sm:inline">{t('common.language')}</span>}
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 outline-none"
                aria-label={t('common.language')}
            >
                {languages.map((item) => (
                    <option key={item.code} value={item.code}>
                        {item.label}
                    </option>
                ))}
            </select>
        </label>
    );
};

export default LanguageSwitcher;
