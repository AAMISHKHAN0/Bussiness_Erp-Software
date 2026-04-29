import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { authenticate, authorize } from '../../middlewares/authMiddleware';
import { inventoryMovementValidators } from '../../middlewares/apiBodyValidators';
import { handleValidationErrors } from '../../middlewares/validateRequest';

const router = Router();

/**
 * All inventory routes are protected
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/inventory
 * @desc    Get stock levels per branch
 * @access  Private (view_inventory)
 */
router.get('/', InventoryController.getInventory);

/**
 * @route   POST /api/v1/inventory/movement
 * @desc    Record a stock movement
 * @access  Private (manage_inventory)
 */
router.post(
    '/movement',
    authorize('manage_inventory'),
    inventoryMovementValidators,
    handleValidationErrors,
    InventoryController.recordMovement
);

export default router;
