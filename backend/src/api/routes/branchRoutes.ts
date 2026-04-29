import { Router } from 'express';
import { BranchController } from '../controllers/branchController';
import { authenticate, authorize } from '../../middlewares/authMiddleware';

const router = Router();

/**
 * All branch routes are protected
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/branches
 * @desc    Get all branches
 * @access  Private (view_branches)
 */
router.get('/', BranchController.getBranches);

/**
 * @route   GET /api/v1/branches/:id
 * @desc    Get branch by ID
 * @access  Private (view_branches)
 */
router.get('/:id', BranchController.getBranchById);

/**
 * @route   POST /api/v1/branches
 * @desc    Create a new branch
 * @access  Private (manage_branches)
 */
router.post('/', authorize('manage_branches'), BranchController.createBranch);

export default router;
