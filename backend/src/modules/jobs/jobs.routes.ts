import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { JOBS, JobName } from './jobs.service';

const router = Router();

// Admin-only manual trigger — lets you run a background job on demand
// (useful for demos/testing without waiting for the cron schedule).
router.post(
  '/:name/run',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const name = req.params.name as JobName;
    const job = JOBS[name];
    if (!job) {
      throw ApiError.badRequest(`Unknown job. Available: ${Object.keys(JOBS).join(', ')}`);
    }
    const result = await job();
    res.json({ success: true, data: result });
  }),
);

// List the jobs that can be triggered.
router.get('/', requireAuth, requireRole('ADMIN'), (_req, res) => {
  res.json({ success: true, data: { jobs: Object.keys(JOBS) } });
});

export default router;
