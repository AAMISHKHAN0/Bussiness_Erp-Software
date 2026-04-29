import { Router } from 'express';
import { LicenseController } from '../controllers/licenseController';
import { authenticate, authorize } from '../../middlewares/authMiddleware';

const router = Router();

/**
 * GET /api/v1/license/status
 * Get the current active status of the system
 */
router.get('/status', LicenseController.getStatus);

/**
 * License activation for current admin (protected)
 */
router.post('/activate', LicenseController.activate);

/**
 * @route   GET /api/v1/license/keys
 * @desc    View all available/used license keys
 * @access  Private (super_admin)
 */
router.get('/keys', authenticate, authorize('super_admin'), LicenseController.getKeys);

export default router;
