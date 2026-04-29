import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authenticate, authorize } from '../../middlewares/authMiddleware';
import { createProductValidators, updateProductValidators } from '../../middlewares/apiBodyValidators';
import { handleValidationErrors } from '../../middlewares/validateRequest';

const router = Router();

/**
 * All product routes are protected
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/products
 * @desc    Get all products
 * @access  Private (view_inventory)
 */
router.get('/', ProductController.getProducts);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get product by ID
 * @access  Private (view_inventory)
 */
router.get('/:id', ProductController.getProductById);

/**
 * @route   POST /api/v1/products
 * @desc    Create a new product
 * @access  Private (manage_inventory)
 */
router.post(
    '/',
    authorize('manage_inventory'),
    createProductValidators,
    handleValidationErrors,
    ProductController.createProduct
);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update a product
 * @access  Private (manage_inventory)
 */
router.put(
    '/:id',
    authorize('manage_inventory'),
    updateProductValidators,
    handleValidationErrors,
    ProductController.updateProduct
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Soft-delete a product
 * @access  Private (manage_inventory)
 */
router.delete('/:id', authorize('manage_inventory'), ProductController.deleteProduct);

export default router;
