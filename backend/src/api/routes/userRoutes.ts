import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate, authorize } from '../../middlewares/authMiddleware';

const router = Router();

/**
 * All user routes are protected and require 'manage_users' permission
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users
 * @access  Private (manage_users)
 */
router.get('/', authorize('manage_users'), UserController.getUsers);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (manage_users)
 */
router.get('/:id', authorize('manage_users'), UserController.getUserById);

/**
 * @route   POST /api/v1/users/:id/deactivate
 * @desc    Deactivate a user
 * @access  Private (manage_users)
 */
router.post('/:id/deactivate', authorize('manage_users'), UserController.deactivateUser);

/**
 * @route   POST /api/v1/users/:id/reactivate
 * @desc    Reactivate a user
 * @access  Private (manage_users)
 */
router.post('/:id/reactivate', authorize('manage_users'), UserController.reactivateUser);

export default router;
