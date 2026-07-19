import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { buildMeta, getPageParams } from '../../utils/pagination';
import { logActivity } from '../../utils/audit';
import { emitToOrg } from '../../sockets/io';

const projectSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
});

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.auth!;
  const { page, limit, skip, search, sortBy, sortOrder } = getPageParams(req);

  const where: Prisma.ProjectWhereInput = {
    organizationId,
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
  };

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: { _count: { select: { tasks: true } } },
    }),
    prisma.project.count({ where }),
  ]);

  res.json({ success: true, data: items, meta: buildMeta(total, page, limit) });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.auth!;
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, organizationId },
    include: { _count: { select: { tasks: true } } },
  });
  if (!project) throw ApiError.notFound('Project not found');
  res.json({ success: true, data: project });
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId, userId } = req.auth!;
  const data = projectSchema.parse(req.body);

  const project = await prisma.project.create({
    data: { ...data, organizationId },
  });

  await logActivity({
    action: 'project.created',
    entityType: 'Project',
    entityId: project.id,
    organizationId,
    userId,
    metadata: { name: project.name },
  });
  emitToOrg(organizationId, 'project:created', project);

  res.status(201).json({ success: true, data: project });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId, userId } = req.auth!;
  const data = projectSchema.partial().parse(req.body);

  const existing = await prisma.project.findFirst({
    where: { id: req.params.id, organizationId },
  });
  if (!existing) throw ApiError.notFound('Project not found');

  const project = await prisma.project.update({
    where: { id: existing.id },
    data,
  });

  await logActivity({
    action: 'project.updated',
    entityType: 'Project',
    entityId: project.id,
    organizationId,
    userId,
  });
  emitToOrg(organizationId, 'project:updated', project);

  res.json({ success: true, data: project });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId, userId } = req.auth!;

  const existing = await prisma.project.findFirst({
    where: { id: req.params.id, organizationId },
  });
  if (!existing) throw ApiError.notFound('Project not found');

  await prisma.project.delete({ where: { id: existing.id } });

  await logActivity({
    action: 'project.deleted',
    entityType: 'Project',
    entityId: existing.id,
    organizationId,
    userId,
    metadata: { name: existing.name },
  });
  emitToOrg(organizationId, 'project:deleted', { id: existing.id });

  res.json({ success: true, message: 'Project deleted' });
});
