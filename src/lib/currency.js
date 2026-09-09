/**
 * NEXIS ERP - Centralized Multi-Currency Engine
 * Default: PKR (Pakistani Rupee) with display symbol 'Rs. '
 * Example: formatCurrency(328180) => 'Rs. 328,180'
 */

export const SUPPORTED_CURRENCIES = {
  PKR: {
    code: 'PKR',
    symbol: 'Rs. ',
    name: 'Pakistani Rupee',
    decimals: 0,
    locale: 'en-PK'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    locale: 'en-US'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
    locale: 'de-DE'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimals: 2,
    locale: 'en-GB'
  },
  AED: {
    code: 'AED',
    symbol: 'AED ',
    name: 'UAE Dirham',
    decimals: 2,
    locale: 'ar-AE'
  },
  SAR: {
    code: 'SAR',
    symbol: 'SAR ',
    name: 'Saudi Riyal',
    decimals: 2,
    locale: 'ar-SA'
  }
};

export const DEFAULT_CURRENCY = 'PKR';

/**
 * Formats a monetary value into the enterprise standard currency representation.
 * 
 * @param {number|string} amount - The numeric or string value to format
 * @param {Object} [options] - Formatting options
 * @param {string} [options.currency='PKR'] - The currency code (PKR, USD, etc.)
 * @param {string} [options.symbol] - Override currency display symbol
 * @param {number} [options.decimals] - Override decimal places
 * @param {boolean} [options.compact=false] - Format in compact notation (e.g. 11.2M)
 * @returns {string} Formatted currency string, e.g. "Rs. 11,278,000"
 */
export function formatCurrency(amount, options = {}) {
  const num = Number(amount);
  if (isNaN(num)) {
    const config = SUPPORTED_CURRENCIES[options.currency || DEFAULT_CURRENCY] || SUPPORTED_CURRENCIES.PKR;
    return `${options.symbol || config.symbol}0`;
  }

  const currencyCode = (options.currency || DEFAULT_CURRENCY).toUpperCase();
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.PKR;
  const symbol = options.symbol !== undefined ? options.symbol : config.symbol;

  if (options.compact) {
    if (Math.abs(num) >= 1_000_000_000) {
      return `${symbol}${(num / 1_000_000_000).toFixed(1)}B`;
    }
    if (Math.abs(num) >= 1_000_000) {
      return `${symbol}${(num / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(num) >= 1_000) {
      return `${symbol}${(num / 1_000).toFixed(0)}k`;
    }
  }

  const decimals = options.decimals !== undefined ? options.decimals : config.decimals;
  const formattedNumber = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return `${symbol}${formattedNumber}`;
}

/**
 * Convenience helper explicitly for Pakistani Rupee (PKR).
 * @param {number|string} amount
 * @returns {string} e.g. "Rs. 328,180"
 */
export function formatPKR(amount, decimals = 0) {
  return formatCurrency(amount, { currency: 'PKR', decimals });
}

/**
 * Get the configuration metadata for a currency code.
 */
export function getCurrencyConfig(code = DEFAULT_CURRENCY) {
  return SUPPORTED_CURRENCIES[code.toUpperCase()] || SUPPORTED_CURRENCIES.PKR;
}
