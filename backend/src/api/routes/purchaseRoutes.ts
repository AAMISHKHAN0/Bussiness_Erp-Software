import { Router } from 'express';
import { PurchaseOrderController } from '../controllers/purchaseOrderController';
import { authenticate, authorize } from '../../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/orders', authorize('view_purchases'), PurchaseOrderController.list);
router.get('/orders/:id', authorize('view_purchases'), PurchaseOrderController.getById);
router.post('/orders', authorize('manage_purchases'), PurchaseOrderController.create);
router.put('/orders/:id', authorize('manage_purchases'), PurchaseOrderController.update);
router.delete('/orders/:id', authorize('manage_purchases'), PurchaseOrderController.remove);

export default router;
