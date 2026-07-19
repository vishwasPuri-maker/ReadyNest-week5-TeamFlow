import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  forgotPasswordController,
  login,
  logout,
  me,
  refresh,
  register,
  resendVerificationController,
  resetPasswordController,
  verifyEmailController,
} from './auth.controller';
import { requireAuth } from '../../middleware/auth';

// Tighter limiter on credential endpoints to blunt brute-force attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

// Email verification & password reset
router.post('/verify-email', verifyEmailController);
router.post('/resend-verification', authLimiter, resendVerificationController);
router.post('/forgot-password', authLimiter, forgotPasswordController);
router.post('/reset-password', authLimiter, resetPasswordController);

export default router;
