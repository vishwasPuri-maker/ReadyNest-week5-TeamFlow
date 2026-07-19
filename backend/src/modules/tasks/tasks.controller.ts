import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { buildMeta, getPageParams } from '../../utils/pagination';
import { logActivity } from '../../utils/audit';
import { emitToOrg } from '../../sockets/io';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  projectId: z.string().min(1),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.coerce.date().optional(),
  assigneeId: z.string().nullable().optional(),
});

const updateSchema = createSchema.partial().omit({ projectId: true });

const taskInclude = {
  assignee: { select: { id: true, name: true, avatarUrl: true } },
  project: { select: { id: true, name: true } },
} satisfies Prisma.TaskInclude;

// Ensures a related entity (project/assignee) belongs to the caller's org.
async function assertInOrg(model: 'project' | 'membership', organizationId: string, id: string) {
  if (model === 'project') {
    const p = await prisma.project.findFirst({ where: { id, organizationId } });
    if (!p) throw ApiError.badRequest('Project not found in this organization');
  } else {
    const m = await prisma.membership.findFirst({ where: { userId: id, organizationId } });
    if (!m) throw ApiError.badRequest('Assignee is not a member of this organization');
  }
}

export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.auth!;
  const { page, limit, skip, search, sortBy, sortOrder } = getPageParams(req);

  const where: Prisma.TaskWhereInput = {
    organizationId,
    ...(search && { title: { contains: search, mode: 'insensitive' } }),
    ...(req.query.status && { status: req.query.status as TaskStatus }),
    ...(req.query.priority && { priority: req.query.priority as TaskPriority }),
    ...(req.query.projectId && { projectId: req.query.projectId as string }),
    ...(req.query.assigneeId && { assigneeId: req.query.assigneeId as string }),
  };

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: taskInclude,
    }),
    prisma.task.count({ where }),
  ]);

  res.json({ success: true, data: items, meta: buildMeta(total, page, limit) });
});

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.auth!;
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, organizationId },
    include: taskInclude,
  });
  if (!task) throw ApiError.notFound('Task not found');
  res.json({ success: true, data: task });
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId, userId } = req.auth!;
  const data = createSchema.parse(req.body);

  await assertInOrg('project', organizationId, data.projectId);
  if (data.assigneeId) await assertInOrg('membership', organizationId, data.assigneeId);

  const task = await prisma.task.create({
    data: { ...data, organizationId },
    include: taskInclude,
  });

  await logActivity({
    action: 'task.created',
    entityType: 'Task',
    entityId: task.id,
    organizationId,
    userId,
    metadata: { title: task.title },
  });
  emitToOrg(organizationId, 'task:created', task);

  res.status(201).json({ success: true, data: task });
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId, userId } = req.auth!;
  const data = updateSchema.parse(req.body);

  const existing = await prisma.task.findFirst({
    where: { id: req.params.id, organizationId },
  });
  if (!existing) throw ApiError.notFound('Task not found');

  if (data.assigneeId) await assertInOrg('membership', organizationId, data.assigneeId);

  const task = await prisma.task.update({
    where: { id: existing.id },
    data,
    include: taskInclude,
  });

  await logActivity({
    action: 'task.updated',
    entityType: 'Task',
    entityId: task.id,
    organizationId,
    userId,
    metadata: { changes: Object.keys(data) },
  });
  emitToOrg(organizationId, 'task:updated', task);

  res.json({ success: true, data: task });
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId, userId } = req.auth!;

  const existing = await prisma.task.findFirst({
    where: { id: req.params.id, organizationId },
  });
  if (!existing) throw ApiError.notFound('Task not found');

  await prisma.task.delete({ where: { id: existing.id } });

  await logActivity({
    action: 'task.deleted',
    entityType: 'Task',
    entityId: existing.id,
    organizationId,
    userId,
    metadata: { title: existing.title },
  });
  emitToOrg(organizationId, 'task:deleted', { id: existing.id });

  res.json({ success: true, message: 'Task deleted' });
});
