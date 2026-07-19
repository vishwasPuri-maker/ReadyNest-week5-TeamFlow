import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../utils/asyncHandler';
import { buildMeta, getPageParams } from '../../utils/pagination';

// Dashboard summary: counts, task breakdowns, and recent activity — all tenant-scoped.
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.auth!;

  const [
    projectCount,
    taskCount,
    memberCount,
    byStatus,
    byPriority,
    overdue,
  ] = await Promise.all([
    prisma.project.count({ where: { organizationId } }),
    prisma.task.count({ where: { organizationId } }),
    prisma.membership.count({ where: { organizationId } }),
    prisma.task.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ['priority'],
      where: { organizationId },
      _count: { _all: true },
    }),
    prisma.task.count({
      where: {
        organizationId,
        dueDate: { lt: new Date() },
        status: { not: 'DONE' },
      },
    }),
  ]);

  const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all]));
  const priorityMap = Object.fromEntries(byPriority.map((p) => [p.priority, p._count._all]));

  res.json({
    success: true,
    data: {
      totals: { projects: projectCount, tasks: taskCount, members: memberCount, overdue },
      tasksByStatus: {
        TODO: statusMap.TODO ?? 0,
        IN_PROGRESS: statusMap.IN_PROGRESS ?? 0,
        DONE: statusMap.DONE ?? 0,
      },
      tasksByPriority: {
        LOW: priorityMap.LOW ?? 0,
        MEDIUM: priorityMap.MEDIUM ?? 0,
        HIGH: priorityMap.HIGH ?? 0,
      },
      completionRate:
        taskCount > 0 ? Math.round(((statusMap.DONE ?? 0) / taskCount) * 100) : 0,
    },
  });
});

// Paginated audit trail for the organization.
export const getActivity = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.auth!;
  const { page, limit, skip } = getPageParams(req);

  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: { organizationId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    }),
    prisma.activityLog.count({ where: { organizationId } }),
  ]);

  res.json({ success: true, data: items, meta: buildMeta(total, page, limit) });
});
