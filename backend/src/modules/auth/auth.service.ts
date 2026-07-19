import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';
import { logActivity } from '../../utils/audit';
import { createToken, consumeToken } from '../../utils/tokens';
import { sendPasswordResetEmail, sendVerificationEmail } from '../../utils/email';
import type { LoginInput, RegisterInput } from './auth.validation';

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'org'
  );
}

async function persistRefreshToken(userId: string, token: string) {
  // Decode the exp claim so the DB row expires in sync with the JWT itself.
  const { exp } = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64').toString(),
  ) as { exp: number };
  await prisma.refreshToken.create({
    data: { token, userId, expiresAt: new Date(exp * 1000) },
  });
}

function publicUser(u: {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified?: boolean;
}) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl,
    emailVerified: u.emailVerified ?? false,
  };
}

// Register creates a User + a new Organization and makes the user its ADMIN.
export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict('Email already registered');

  let slug = slugify(input.organizationName);
  if (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const { user, membership, organization } = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: input.organizationName, slug },
    });
    const user = await tx.user.create({
      data: { email: input.email, name: input.name, passwordHash },
    });
    const membership = await tx.membership.create({
      data: { userId: user.id, organizationId: organization.id, role: 'ADMIN' },
    });
    return { user, membership, organization };
  });

  await logActivity({
    action: 'org.created',
    entityType: 'Organization',
    entityId: organization.id,
    organizationId: organization.id,
    userId: user.id,
  });

  // Send verification email (non-blocking: failure shouldn't break signup).
  const verifyToken = await createToken(user.id, 'EMAIL_VERIFY');
  sendVerificationEmail(user.email, user.name, verifyToken).catch((e) =>
    console.error('Verification email failed:', e),
  );

  return issueTokens(user, membership.organizationId, membership.role, organization.name);
}

// --- Email verification ---

export async function verifyEmail(token: string) {
  const userId = await consumeToken(token, 'EMAIL_VERIFY');
  if (!userId) throw ApiError.badRequest('Invalid or expired verification link');
  await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
  return { verified: true };
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // Always return success to avoid leaking which emails exist.
  if (user && !user.emailVerified) {
    const token = await createToken(user.id, 'EMAIL_VERIFY');
    await sendVerificationEmail(user.email, user.name, token);
  }
  return { sent: true };
}

// --- Password reset ---

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (user) {
    const token = await createToken(user.id, 'PASSWORD_RESET');
    await sendPasswordResetEmail(user.email, user.name, token);
  }
  return { sent: true };
}

export async function resetPassword(token: string, newPassword: string) {
  const userId = await consumeToken(token, 'PASSWORD_RESET');
  if (!userId) throw ApiError.badRequest('Invalid or expired reset link');

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  // Revoke all sessions after a password reset.
  await prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });

  return { reset: true };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { memberships: { include: { organization: true } } },
  });
  if (!user) throw ApiError.unauthorized('Invalid credentials');

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Invalid credentials');

  if (user.memberships.length === 0) {
    throw ApiError.forbidden('User has no organization membership');
  }

  const membership =
    (input.organizationId &&
      user.memberships.find((m) => m.organizationId === input.organizationId)) ||
    user.memberships[0];

  return issueTokens(user, membership.organizationId, membership.role, membership.organization.name);
}

async function issueTokens(
  user: { id: string; email: string; name: string; avatarUrl: string | null; emailVerified: boolean },
  organizationId: string,
  role: 'ADMIN' | 'MEMBER',
  organizationName: string,
) {
  const accessToken = signAccessToken({ userId: user.id, organizationId, role });
  const refreshToken = signRefreshToken(user.id);
  await persistRefreshToken(user.id, refreshToken);

  return {
    user: publicUser(user),
    organization: { id: organizationId, name: organizationName, role },
    accessToken,
    refreshToken,
  };
}

// Rotates the refresh token: old one is revoked, a fresh pair issued.
export async function refreshSession(oldToken: string) {
  if (!oldToken) throw ApiError.unauthorized('Missing refresh token');

  let userId: string;
  try {
    ({ userId } = verifyRefreshToken(oldToken));
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: oldToken } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token expired or revoked');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { memberships: { include: { organization: true } } },
  });
  if (!user || user.memberships.length === 0) throw ApiError.unauthorized();

  await prisma.refreshToken.update({ where: { token: oldToken }, data: { revoked: true } });

  const membership = user.memberships[0];
  return issueTokens(user, membership.organizationId, membership.role, membership.organization.name);
}

export async function logoutUser(refreshToken: string) {
  if (!refreshToken) return;
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { revoked: true },
  });
}

export async function getMe(userId: string, organizationId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { memberships: { include: { organization: true } } },
  });
  if (!user) throw ApiError.notFound('User not found');
  const active = user.memberships.find((m) => m.organizationId === organizationId);
  return {
    user: publicUser(user),
    organization: active
      ? { id: active.organizationId, name: active.organization.name, role: active.role }
      : null,
    memberships: user.memberships.map((m) => ({
      organizationId: m.organizationId,
      organizationName: m.organization.name,
      role: m.role,
    })),
  };
}
