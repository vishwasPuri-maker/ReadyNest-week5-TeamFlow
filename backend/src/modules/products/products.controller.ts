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
  name: z.string().min(1).max(160),
  sku: z.string().min(1).max(60),
  price: z.number().int().min(0), // paise
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
});
const updateSchema = createSchema.partial();

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.auth!;
  const { page, limit, skip, search, sortBy, sortOrder } = getPageParams(req);

  const where: Prisma.ProductWhereInput = {
    organizationId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ],
    }),
    // ?lowStock=true → only products at/under their threshold
    ...(req.query.lowStock === 'true' && { stock: { lte: prisma.product.fields.lowStockThreshold } }),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
    prisma.product.count({ where }),
  ]);

  res.json({ success: true, data: items, meta: buildMeta(total, page, limit) });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.auth!;
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, organizationId },
  });
  if (!product) throw ApiError.notFound('Product not found');
  res.json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId, userId } = req.auth!;
  const data = createSchema.parse(req.body);

  const dupe = await prisma.product.findUnique({
    where: { organizationId_sku: { organizationId, sku: data.sku } },
  });
  if (dupe) throw ApiError.conflict('A product with this SKU already exists');

  const product = await prisma.product.create({ data: { ...data, organizationId } });

  await logActivity({
    action: 'product.created',
    entityType: 'Product',
    entityId: product.id,
    organizationId,
    userId,
    metadata: { name: product.name, sku: product.sku },
  });
  emitToOrg(organizationId, 'product:created', product);

  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId, userId } = req.auth!;
  const data = updateSchema.parse(req.body);

  const existing = await prisma.product.findFirst({ where: { id: req.params.id, organizationId } });
  if (!existing) throw ApiError.notFound('Product not found');

  const product = await prisma.product.update({ where: { id: existing.id }, data });

  await logActivity({
    action: 'product.updated',
    entityType: 'Product',
    entityId: product.id,
    organizationId,
    userId,
    metadata: { changes: Object.keys(data) },
  });
  emitToOrg(organizationId, 'product:updated', product);

  res.json({ success: true, data: product });
});

const restockSchema = z.object({ quantity: z.number().int().positive() });

// Restock uses an atomic increment (safe under concurrency, same as the sale path).
export const restockProduct = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId, userId } = req.auth!;
  const { quantity } = restockSchema.parse(req.body);

  const existing = await prisma.product.findFirst({ where: { id: req.params.id, organizationId } });
  if (!existing) throw ApiError.notFound('Product not found');

  const product = await prisma.product.update({
    where: { id: existing.id },
    data: { stock: { increment: quantity } },
  });

  await logActivity({
    action: 'product.restocked',
    entityType: 'Product',
    entityId: product.id,
    organizationId,
    userId,
    metadata: { quantity, newStock: product.stock },
  });
  emitToOrg(organizationId, 'product:updated', product);

  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId, userId } = req.auth!;

  const existing = await prisma.product.findFirst({ where: { id: req.params.id, organizationId } });
  if (!existing) throw ApiError.notFound('Product not found');

  try {
    await prisma.product.delete({ where: { id: existing.id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      throw ApiError.conflict('Cannot delete a product that appears in past orders');
    }
    throw err;
  }

  await logActivity({
    action: 'product.deleted',
    entityType: 'Product',
    entityId: existing.id,
    organizationId,
    userId,
    metadata: { name: existing.name },
  });
  emitToOrg(organizationId, 'product:deleted', { id: existing.id });

  res.json({ success: true, message: 'Product deleted' });
});
