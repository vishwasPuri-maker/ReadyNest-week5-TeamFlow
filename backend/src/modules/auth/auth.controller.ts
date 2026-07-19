import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  tokenSchema,
} from './auth.validation';
import {
  forgotPassword,
  getMe,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
  resendVerification,
  resetPassword,
  verifyEmail,
} from './auth.service';

const REFRESH_COOKIE = 'refreshToken';
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const result = await registerUser(data);
  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
  res.status(201).json({ success: true, data: result });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  const result = await loginUser(data);
  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
  res.json({ success: true, data: result });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
  const result = await refreshSession(token);
  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
  res.json({ success: true, data: result });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
  await logoutUser(token);
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
  res.json({ success: true, message: 'Logged out' });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const data = await getMe(req.auth!.userId, req.auth!.organizationId);
  res.json({ success: true, data });
});

export const verifyEmailController = asyncHandler(async (req: Request, res: Response) => {
  const { token } = tokenSchema.parse({ token: req.body?.token ?? req.query.token });
  const data = await verifyEmail(token);
  res.json({ success: true, data, message: 'Email verified' });
});

export const resendVerificationController = asyncHandler(async (req: Request, res: Response) => {
  const { email } = emailSchema.parse(req.body);
  await resendVerification(email);
  res.json({ success: true, message: 'If the account exists and is unverified, an email was sent' });
});

export const forgotPasswordController = asyncHandler(async (req: Request, res: Response) => {
  const { email } = emailSchema.parse(req.body);
  await forgotPassword(email);
  res.json({ success: true, message: 'If that email exists, a reset link was sent' });
});

export const resetPasswordController = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = resetPasswordSchema.parse(req.body);
  await resetPassword(token, password);
  res.json({ success: true, message: 'Password updated. Please sign in.' });
});
