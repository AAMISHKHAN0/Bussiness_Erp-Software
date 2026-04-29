/**
 * Input validation helpers
 */

export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
    if (!password || password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    return hasUpper && hasLower && hasDigit;
};

export const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s-()]{7,15}$/;
    return phoneRegex.test(phone);
};

export const sanitizeString = (str: any): any => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '');
};

export const isPositiveNumber = (value: any): boolean => {
    const num = Number(value);
    return !isNaN(num) && num > 0;
};

export const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
};

export interface ValidationResult {
    valid: boolean;
    missing: string[];
}

/**
 * Validate required fields in request body
 * @param body - Request body
 * @param fields - Required field names
 * @returns {ValidationResult}
 */
export const validateRequired = (body: any, fields: string[]): ValidationResult => {
    const missing = fields.filter(
        (field) => body[field] === undefined || body[field] === null || body[field] === ''
    );
    return { valid: missing.length === 0, missing };
};
