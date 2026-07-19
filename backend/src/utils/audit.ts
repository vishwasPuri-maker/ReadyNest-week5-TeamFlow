import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

interface LogInput {
  action: string;
  entityType: string;
  entityId?: string;
  organizationId: string;
  userId?: string;
  metadata?: Prisma.InputJsonValue;
}

// Fire-and-forget audit logging; never blocks the main request path.
export async function logActivity(input: LogInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        organizationId: input.organizationId,
        userId: input.userId,
        metadata: input.metadata,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
