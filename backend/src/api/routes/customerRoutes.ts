import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { authenticate, authorize } from '../../middlewares/authMiddleware';

const router = Router();

/**
 * All customer routes are protected
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/customers
 * @desc    Get all active customers
 * @access  Private (view_sales)
 */
router.get('/', authorize('view_sales'), CustomerController.getCustomers);

/**
 * @route   GET /api/v1/customers/:id
 * @desc    Get customer by ID
 * @access  Private (view_sales)
 */
router.get('/:id', authorize('view_sales'), CustomerController.getCustomerById);

/**
 * @route   POST /api/v1/customers
 * @desc    Create a new customer
 * @access  Private (manage_sales)
 */
router.post('/', authorize('manage_sales'), CustomerController.createCustomer);

/**
 * @route   DELETE /api/v1/customers/:id
 * @desc    Soft delete a customer
 * @access  Private (manage_sales)
 */
router.delete('/:id', authorize('manage_sales'), CustomerController.deleteCustomer);

export default router;
