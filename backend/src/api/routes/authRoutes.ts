import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../../middlewares/authMiddleware';
import { loginValidators, registerValidators } from '../../middlewares/apiBodyValidators';
import { handleValidationErrors } from '../../middlewares/validateRequest';

const router = Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user & get tokens
 * @access  Public
 */
router.post('/login', loginValidators, handleValidationErrors, AuthController.login);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user (Usually Admin only in ERP)
 * @access  Admin
 */
router.post('/register', registerValidators, handleValidationErrors, AuthController.register);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', AuthController.refresh);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user & clear cookie
 * @access  Public
 */
router.post('/logout', AuthController.logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, AuthController.getMe);

export default router;
