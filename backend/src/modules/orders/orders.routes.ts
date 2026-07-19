import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { createOrder, getOrder, listOrders } from './orders.controller';

const router = Router();

router.use(requireAuth);

// Both owners and cashiers (staff) can ring up sales.
router.post('/', createOrder);
router.get('/', listOrders);
router.get('/:id', getOrder);

export default router;
