import { Router } from 'express';
import { AccountController } from '../controllers/accountController';
import { authenticate, authorize } from '../../middlewares/authMiddleware';

const router = Router();

/**
 * All accounting routes are protected
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/accounting/accounts
 * @desc    Get chart of accounts
 * @access  Private (view_accounting)
 */
router.get('/accounts', authorize('view_accounting'), AccountController.getAccounts);

/**
 * @route   POST /api/v1/accounting/accounts
 * @desc    Create a new account
 * @access  Private (manage_accounting)
 */
router.post('/accounts', authorize('manage_accounting'), AccountController.createAccount);

/**
 * @route   POST /api/v1/accounting/journals
 * @desc    Create a journal entry
 * @access  Private (manage_accounting)
 */
router.post('/journals', authorize('manage_accounting'), AccountController.createJournalEntry);

router.get('/transactions', authorize('view_accounting'), AccountController.getTransactions);
router.delete(
    '/transactions/:id',
    authorize('manage_accounting'),
    AccountController.deleteTransaction
);

export default router;
