import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController';
import { authenticate, authorize } from '../../middlewares/authMiddleware';

const router = Router();

/**
 * All category routes are protected
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/categories
 * @desc    Get all active categories
 * @access  Private (view_inventory)
 */
router.get('/', CategoryController.getCategories);

/**
 * @route   POST /api/v1/categories
 * @desc    Create a new category
 * @access  Private (manage_inventory)
 */
router.post('/', authorize('manage_inventory'), CategoryController.createCategory);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update a category
 * @access  Private (manage_inventory)
 */
router.put('/:id', authorize('manage_inventory'), CategoryController.updateCategory);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete a category
 * @access  Private (manage_inventory)
 */
router.delete('/:id', authorize('manage_inventory'), CategoryController.deleteCategory);

export default router;
