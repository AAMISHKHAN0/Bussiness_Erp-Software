import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticate, authorize } from '../../middlewares/authMiddleware';

const router = Router();

/**
 * All report routes are protected
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/reports/sales-summary
 * @desc    Get sales summary trends
 * @access  Private (view_reports)
 */
router.get('/sales-summary', authorize('view_reports'), ReportController.getSalesSummary);

/**
 * @route   GET /api/v1/reports/dashboard-timeseries
 * @desc    Get real monthly dashboard sales/purchase trend data
 * @access  Private (view_dashboard)
 */
router.get('/dashboard-timeseries', authorize('view_dashboard'), ReportController.getDashboardTimeSeries);

/**
 * @route   GET /api/v1/reports/inventory-summary
 * @desc    Get inventory summary trends
 * @access  Private (view_reports)
 */
router.get('/inventory-summary', authorize('view_reports'), ReportController.getInventorySummary);

/**
 * @route   GET /api/v1/reports/hr-summary
 * @desc    Get HR headcount and payroll summary
 * @access  Private (view_reports)
 */
router.get('/hr-summary', authorize('view_reports'), ReportController.getHRSummary);

/**
 * @route   GET /api/v1/reports/dashboard-stats
 * @desc    Get dashboard KPI statistics
 * @access  Private (view_dashboard)
 */
router.get('/dashboard-stats', authorize('view_dashboard'), ReportController.getDashboardStats);

export default router;
