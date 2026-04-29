import { Router } from 'express';
import { SupplierController } from '../controllers/supplierController';
import { authenticate, authorize } from '../../middlewares/authMiddleware';

const router = Router();

/**
 * All supplier routes are protected
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/suppliers
 * @desc    Get all active suppliers
 * @access  Private (view_suppliers)
 */
router.get('/', SupplierController.getSuppliers);

/**
 * @route   GET /api/v1/suppliers/:id
 * @desc    Get supplier by ID
 * @access  Private (view_suppliers)
 */
router.get('/:id', SupplierController.getSupplierById);

/**
 * @route   POST /api/v1/suppliers
 * @desc    Create a new supplier
 * @access  Private (manage_suppliers)
 */
router.post('/', authorize('manage_suppliers'), SupplierController.createSupplier);

/**
 * @route   DELETE /api/v1/suppliers/:id
 * @desc    Soft delete a supplier
 * @access  Private (manage_suppliers)
 */
router.delete('/:id', authorize('manage_suppliers'), SupplierController.deleteSupplier);

export default router;
