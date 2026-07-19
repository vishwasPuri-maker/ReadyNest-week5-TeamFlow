import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getActivity, getDashboard } from './analytics.controller';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', getDashboard);
router.get('/activity', getActivity);

export default router;
