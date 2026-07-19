import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { buildMeta, getPageParams } from '../../utils/pagination';
import { logActivity } from '../../utils/audit';
import { emitToOrg } from '../../sockets/io';

const createSchema = z.object({
  customerName: z.string().max(120).optional(),
  items: z
    .array(z.object({ productId: z.string().min(1), quantity: z.number().int().positive() }))
    .min(1, 'An order needs at least one item'),
});

const orderInclude = {
  items: { include: { product: { select: { id: true, name: true, sku: true } } } },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.OrderInclude;

// Retry only on write-conflict / deadlock (Prisma P2034); business errors never retry.
function isRetryable(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034';
}

/**
 * Create an order (a sale) with CONCURRENCY-SAFE stock handling.
 *
 * The oversell problem: two cashiers sell the last unit at the same time. A
 * naive read-then-write ("check stock, then subtract") loses updates and
 * oversells. We avoid that with an ATOMIC CONDITIONAL DECREMENT:
 *
 *     UPDATE "Product" SET stock = stock - qty
 *     WHERE id = ? AND organizationId = ? AND stock >= qty
 *
 * Postgres takes a row lock for the UPDATE and re-evaluates `stock >= qty`
 * against the latest committed value, so concurrent decrements serialize on
 * the row. If a second sale can't be satisfied, 0 rows change and we abort —
 * the whole transaction rolls back, so no partial sale and no oversell.
 *
 * Extra safeguards:
 *  - items are locked in a stable order (sorted by productId) → no deadlocks
 *  - the order + items + every decrement run in ONE transaction → all-or-nothing
 *  - transient write-conflicts (P2034) are retried a few times
 *  - every row is organizationId-scoped → tenants can never corrupt each other
 */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId, userId } = req.auth!;
  const input = createSchema.parse(req.body);

  // Merge duplicate lines and sort by productId for deterministic lock ordering.
  const merged = new Map<string, number>();
  for (const it of input.items) merged.set(it.productId, (merged.get(it.productId) ?? 0) + it.quantity);
  const lines = [...merged.entries()]
    .map(([productId, quantity]) => ({ productId, quantity }))
    .sort((a, b) => a.productId.localeCompare(b.productId));

  // Read prices + validate ownership BEFORE the transaction. Pricing needs no
  // lock, so we keep the locked critical section as short as possible (fewer
  // network round-trips holding the row lock = far less contention).
  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) }, organizationId },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  for (const l of lines) {
    if (!byId.has(l.productId)) throw ApiError.badRequest('Product not found in this store');
  }

  const items = lines.map((l) => {
    const p = byId.get(l.productId)!;
    return { productId: l.productId, quantity: l.quantity, unitPrice: p.price, lineTotal: p.price * l.quantity };
  });
  const total = items.reduce((sum, i) => sum + i.lineTotal, 0);

  const MAX_RETRIES = 3;
  let order;

  for (let attempt = 1; ; attempt++) {
    try {
      order = await prisma.$transaction(
        async (tx) => {
          // Atomic conditional decrement — the line of defence against oversell.
          for (const l of lines) {
            const affected = await tx.$executeRaw`
              UPDATE "Product"
              SET stock = stock - ${l.quantity}, "updatedAt" = now()
              WHERE id = ${l.productId}
                AND "organizationId" = ${organizationId}
                AND stock >= ${l.quantity}`;
            if (affected === 0) {
              const p = byId.get(l.productId)!;
              throw ApiError.conflict(`Insufficient stock for "${p.name}" (have ${p.stock}, need ${l.quantity})`);
            }
          }

          return tx.order.create({
            data: {
              organizationId,
              createdById: userId,
              customerName: input.customerName,
              total,
              items: { create: items },
            },
            include: orderInclude,
          });
        },
        // Generous limits so lock-queued sales wait their turn rather than
        // erroring; retries handle genuine write conflicts.
        { timeout: 20000, maxWait: 20000 },
      );
      break; // success
    } catch (err) {
      if (isRetryable(err) && attempt < MAX_RETRIES) continue;
      throw err;
    }
  }

  await logActivity({
    action: 'order.created',
    entityType: 'Order',
    entityId: order.id,
    organizationId,
    userId,
    metadata: { total: order.total, items: order.items.length },
  });
  // Real-time new-order alert to everyone in the store.
  emitToOrg(organizationId, 'order:created', order);

  res.status(201).json({ success: true, data: order });
});

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.auth!;
  const { page, limit, skip, sortBy, sortOrder } = getPageParams(req);

  const where: Prisma.OrderWhereInput = { organizationId };

  const [items, total] = await Promise.all([
    prisma.order.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder }, include: orderInclude }),
    prisma.order.count({ where }),
  ]);

  res.json({ success: true, data: items, meta: buildMeta(total, page, limit) });
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.auth!;
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, organizationId },
    include: orderInclude,
  });
  if (!order) throw ApiError.notFound('Order not found');
  res.json({ success: true, data: order });
});
