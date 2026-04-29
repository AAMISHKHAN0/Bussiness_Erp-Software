import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate, authorize } from '../../middlewares/authMiddleware';

const router = Router();

/**
 * All admin routes are protected
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/admin/settings
 * @desc    Get system settings
 * @access  Private (view_settings)
 */
router.get('/settings', authorize('view_settings'), AdminController.getSettings);

/**
 * @route   PUT /api/v1/admin/settings
 * @desc    Update system settings
 * @access  Private (manage_settings)
 */
router.put('/settings', authorize('manage_settings'), AdminController.updateSettings);

/**
 * @route   GET /api/v1/admin/audit-logs
 * @desc    Get system audit logs
 * @access  Private (view_audit)
 */
router.get('/audit-logs', authorize('view_audit'), AdminController.getAuditLogs);

/**
 * @route   GET /api/v1/admin/health
 * @desc    Get system health status
 * @access  Private (view_dashboard)
 */
router.get('/health', AdminController.getHealth);

export default router;
