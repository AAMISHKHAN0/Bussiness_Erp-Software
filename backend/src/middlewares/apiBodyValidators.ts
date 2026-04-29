import { body } from 'express-validator';

export const loginValidators = [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

/** Route-level checks; AuthService still enforces password policy. */
export const registerValidators = [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
        .withMessage(
            'Password must be at least 8 characters and include uppercase, lowercase, and a number'
        ),
    body('firstName').trim().notEmpty().withMessage('firstName is required'),
    body('lastName').trim().notEmpty().withMessage('lastName is required'),
];

export const createSalesOrderValidators = [
    body('customer_id').trim().notEmpty().withMessage('customer_id is required'),
    body('branch_id').trim().notEmpty().withMessage('branch_id is required'),
    body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
    body('items.*.product_id').trim().notEmpty().withMessage('Each item needs product_id'),
    body('items.*.quantity').isFloat({ gt: 0 }).withMessage('Each item needs quantity > 0'),
    body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Each item needs unit_price >= 0'),
];

export const inventoryMovementValidators = [
    body('product_id').trim().notEmpty().withMessage('product_id is required'),
    body('branch_id').trim().notEmpty().withMessage('branch_id is required'),
    body('movement_type')
        .isIn(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'])
        .withMessage('Invalid movement_type'),
    body('quantity').isFloat({ gt: 0 }).withMessage('quantity must be a positive number'),
];

export const createProductValidators = [
    body('name').trim().notEmpty().withMessage('name is required'),
    body('base_price').isFloat({ min: 0 }).withMessage('base_price must be a number >= 0'),
];

export const updateProductValidators = [
    body('name').trim().notEmpty().withMessage('name is required'),
    body('base_price').isFloat({ min: 0 }).withMessage('base_price must be a number >= 0'),
];
