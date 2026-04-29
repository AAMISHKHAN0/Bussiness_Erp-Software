// Currency formatter utility
export const getCurrencySettings = () => {
    try {
        const settings = JSON.parse(localStorage.getItem('erp_settings') || '{}');
        return {
            currency: settings.currency || 'USD',
            symbol: getCurrencySymbol(settings.currency || 'USD')
        };
    } catch {
        return { currency: 'USD', symbol: '$' };
    }
};

export const getCurrencySymbol = (currency) => {
    const symbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'INR': '₹',
        'PKR': '₨'
    };
    return symbols[currency] || '$';
};

export const formatCurrency = (amount, currency = null) => {
    const settings = currency ? { symbol: getCurrencySymbol(currency) } : getCurrencySettings();
    const symbol = settings.symbol;
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `${symbol}${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
