import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { buildMeta, getPageParams } from '../../utils/pagination';
import { logActivity } from '../../utils/audit';

// List all members of the caller's organization (used for assignee dropdowns too).
export const listMembers = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.auth!;
  const { page, limit, skip, search } = getPageParams(req);

  const where = {
    organizationId,
    ...(search && {
      user: {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      },
    }),
  };

  const [items, total] = await Promise.all([
    prisma.membership.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    }),
    prisma.membership.count({ where }),
  ]);

  const members = items.map((m) => ({
    membershipId: m.id,
    role: m.role,
    joinedAt: m.createdAt,
    ...m.user,
  }));

  res.json({ success: true, data: members, meta: buildMeta(total, page, limit) });
});

const inviteSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(6).max(128),
  role: z.nativeEnum(Role).default('MEMBER'),
});

// Admin adds a member: creates the user if new, then attaches a membership.
export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId, userId } = req.auth!;
  const data = inviteSchema.parse(req.body);

  let user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: await bcrypt.hash(data.password, 10),
      },
    });
  }

  const existing = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId } },
  });
  if (existing) throw ApiError.conflict('User is already a member of this organization');

  const membership = await prisma.membership.create({
    data: { userId: user.id, organizationId, role: data.role },
  });

  await logActivity({
    action: 'member.added',
    entityType: 'Member',
    entityId: user.id,
    organizationId,
    userId,
    metadata: { email: user.email, role: data.role },
  });

  res.status(201).json({
    success: true,
    data: { membershipId: membership.id, role: membership.role, id: user.id, name: user.name, email: user.email },
  });
});

const roleSchema = z.object({ role: z.nativeEnum(Role) });

export const updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId, userId } = req.auth!;
  const { role } = roleSchema.parse(req.body);

  const membership = await prisma.membership.findFirst({
    where: { id: req.params.membershipId, organizationId },
  });
  if (!membership) throw ApiError.notFound('Member not found');

  // Guard: don't allow removing the last admin of an org.
  if (membership.role === 'ADMIN' && role !== 'ADMIN') {
    const adminCount = await prisma.membership.count({ where: { organizationId, role: 'ADMIN' } });
    if (adminCount <= 1) throw ApiError.badRequest('An organization must have at least one admin');
  }

  const updated = await prisma.membership.update({
    where: { id: membership.id },
    data: { role },
  });

  await logActivity({
    action: 'member.role_changed',
    entityType: 'Member',
    entityId: membership.userId,
    organizationId,
    userId,
    metadata: { role },
  });

  res.json({ success: true, data: { membershipId: updated.id, role: updated.role } });
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId, userId } = req.auth!;

  const membership = await prisma.membership.findFirst({
    where: { id: req.params.membershipId, organizationId },
  });
  if (!membership) throw ApiError.notFound('Member not found');

  if (membership.userId === userId) throw ApiError.badRequest('You cannot remove yourself');
  if (membership.role === 'ADMIN') {
    const adminCount = await prisma.membership.count({ where: { organizationId, role: 'ADMIN' } });
    if (adminCount <= 1) throw ApiError.badRequest('An organization must have at least one admin');
  }

  await prisma.membership.delete({ where: { id: membership.id } });

  await logActivity({
    action: 'member.removed',
    entityType: 'Member',
    entityId: membership.userId,
    organizationId,
    userId,
  });

  res.json({ success: true, message: 'Member removed' });
});
