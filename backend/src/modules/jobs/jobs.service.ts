import { prisma } from '../../config/prisma';
import { sendOverdueDigestEmail } from '../../utils/email';
import { logActivity } from '../../utils/audit';

export interface JobResult {
  job: string;
  ranAt: string;
  summary: string;
  details?: Record<string, unknown>;
}

// --- Job 1: purge expired/stale tokens (DB hygiene) ---
export async function runTokenCleanup(): Promise<JobResult> {
  const now = new Date();

  const [refresh, verification] = await prisma.$transaction([
    // Expired OR revoked refresh tokens are dead weight — remove them.
    prisma.refreshToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: now } }, { revoked: true }] },
    }),
    // Used OR expired verification / reset tokens.
    prisma.verificationToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
    }),
  ]);

  return {
    job: 'token-cleanup',
    ranAt: now.toISOString(),
    summary: `Purged ${refresh.count} refresh + ${verification.count} verification tokens`,
    details: { refreshTokens: refresh.count, verificationTokens: verification.count },
  };
}

// --- Job 2: email each org's admins a digest of overdue tasks ---
export async function runOverdueDigest(): Promise<JobResult> {
  const now = new Date();

  const overdue = await prisma.task.findMany({
    where: { dueDate: { lt: now }, status: { not: 'DONE' } },
    include: {
      project: { select: { name: true } },
      assignee: { select: { name: true } },
    },
  });

  // Group overdue tasks by organization.
  const byOrg = new Map<string, typeof overdue>();
  for (const t of overdue) {
    const list = byOrg.get(t.organizationId) ?? [];
    list.push(t);
    byOrg.set(t.organizationId, list);
  }

  let orgsNotified = 0;
  let emailsSent = 0;

  for (const [organizationId, tasks] of byOrg) {
    const admins = await prisma.membership.findMany({
      where: { organizationId, role: 'ADMIN' },
      include: { user: { select: { name: true, email: true } }, organization: { select: { name: true } } },
    });
    if (admins.length === 0) continue;

    const items = tasks.map((t) => ({
      title: t.title,
      projectName: t.project.name,
      dueDate: t.dueDate,
      assigneeName: t.assignee?.name ?? null,
    }));

    for (const admin of admins) {
      await sendOverdueDigestEmail(admin.user.email, admin.user.name, admin.organization.name, items);
      emailsSent++;
    }
    orgsNotified++;

    await logActivity({
      action: 'digest.sent',
      entityType: 'Organization',
      entityId: organizationId,
      organizationId,
      metadata: { overdueCount: tasks.length },
    });
  }

  return {
    job: 'overdue-digest',
    ranAt: now.toISOString(),
    summary: `${overdue.length} overdue tasks → notified ${orgsNotified} org(s), ${emailsSent} email(s)`,
    details: { overdueTasks: overdue.length, orgsNotified, emailsSent },
  };
}

export const JOBS = {
  'token-cleanup': runTokenCleanup,
  'overdue-digest': runOverdueDigest,
} as const;

export type JobName = keyof typeof JOBS;
