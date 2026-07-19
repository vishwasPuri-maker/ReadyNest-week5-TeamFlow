import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getSalesAnalytics } from './store.controller';

const router = Router();

router.get('/analytics', requireAuth, getSalesAnalytics);

export default router;
