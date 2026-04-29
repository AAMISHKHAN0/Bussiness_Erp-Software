import { Router } from 'express';
import { SalesOrderController } from '../controllers/salesOrderController';
import { InvoiceController } from '../controllers/invoiceController';
import { authenticate, authorize } from '../../middlewares/authMiddleware';
import { createSalesOrderValidators } from '../../middlewares/apiBodyValidators';
import { handleValidationErrors } from '../../middlewares/validateRequest';

const router = Router();

/**
 * All sales routes are protected
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/sales/orders
 * @desc    Get all sales orders
 * @access  Private (view_sales)
 */
router.get('/orders', authorize('view_sales'), SalesOrderController.getOrders);

/**
 * @route   GET /api/v1/sales/orders/:id
 * @desc    Get sales order by ID
 * @access  Private (view_sales)
 */
router.get('/orders/:id', authorize('view_sales'), SalesOrderController.getOrderById);

/**
 * @route   POST /api/v1/sales/orders
 * @desc    Create a new sales order
 * @access  Private (manage_sales)
 */
router.post(
    '/orders',
    authorize('manage_sales'),
    createSalesOrderValidators,
    handleValidationErrors,
    SalesOrderController.createOrder
);

router.get('/invoices', authorize('view_sales'), InvoiceController.list);
router.post('/invoices', authorize('manage_sales'), InvoiceController.create);
router.delete('/invoices/:id', authorize('manage_sales'), InvoiceController.deleteInvoice);

export default router;
