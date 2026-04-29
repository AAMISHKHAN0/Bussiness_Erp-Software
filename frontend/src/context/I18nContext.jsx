import { createContext, useContext, useEffect, useState } from 'react';
import { languageOptions, translations } from '../i18n/translations';

const I18nContext = createContext(null);

const DEFAULT_LANGUAGE = 'en';
const STORAGE_KEY = 'erp_language';

const getNestedValue = (obj, path) => path.split('.').reduce((acc, key) => acc?.[key], obj);

export const I18nProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, language);
        const option = languageOptions.find((item) => item.code === language) || languageOptions[0];
        document.documentElement.lang = option.locale;
    }, [language]);

    const t = (key, params = {}) => {
        const current = translations[language] || translations[DEFAULT_LANGUAGE];
        const fallback = translations[DEFAULT_LANGUAGE];
        const template = getNestedValue(current, key) ?? getNestedValue(fallback, key) ?? key;

        return Object.entries(params).reduce(
            (message, [paramKey, value]) => message.replaceAll(`{${paramKey}}`, String(value)),
            template
        );
    };

    const getLocale = () => {
        const option = languageOptions.find((item) => item.code === language);
        return option?.locale || 'en-US';
    };

    const value = {
        language,
        setLanguage,
        languages: languageOptions,
        locale: getLocale(),
        t,
    };

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
};

export default I18nContext;
