import { Router } from 'express';
import { HrController } from '../controllers/hrController';
import { authenticate, authorize } from '../../middlewares/authMiddleware';

const router = Router();

/**
 * All HR routes are protected
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/hr/employees
 * @desc    Get all active employees
 * @access  Private (view_hr)
 */
router.get('/employees', authorize('view_hr'), HrController.getEmployees);

/**
 * @route   POST /api/v1/hr/employees
 * @desc    Register a new employee
 * @access  Private (manage_hr)
 */
router.post('/employees', authorize('manage_hr'), HrController.createEmployee);

/**
 * @route   DELETE /api/v1/hr/employees/:id
 * @desc    Soft delete an employee
 * @access  Private (manage_hr)
 */
router.delete('/employees/:id', authorize('manage_hr'), HrController.deactivateEmployee);

/**
 * @route   GET /api/v1/hr/attendance
 * @desc    Get attendance records
 * @access  Private (view_hr)
 */
router.get('/attendance', authorize('view_hr'), HrController.getAttendance);

/**
 * @route   GET /api/v1/hr/payroll
 * @desc    Get payroll history
 * @access  Private (view_hr)
 */
router.get('/payroll', authorize('view_hr'), HrController.getPayroll);

export default router;
