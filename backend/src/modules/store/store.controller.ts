import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../utils/asyncHandler';

// Sales analytics dashboard — all tenant-scoped.
export const getSalesAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.auth!;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    revenueAgg,
    orderCount,
    todayAgg,
    productCount,
    lowStock,
    topItems,
  ] = await Promise.all([
    prisma.order.aggregate({ where: { organizationId, status: 'COMPLETED' }, _sum: { total: true } }),
    prisma.order.count({ where: { organizationId } }),
    prisma.order.aggregate({
      where: { organizationId, status: 'COMPLETED', createdAt: { gte: startOfToday } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.product.count({ where: { organizationId } }),
    prisma.product.findMany({
      where: { organizationId, stock: { lte: prisma.product.fields.lowStockThreshold } },
      select: { id: true, name: true, sku: true, stock: true, lowStockThreshold: true },
      orderBy: { stock: 'asc' },
      take: 10,
    }),
    // Best sellers by units sold (within this tenant).
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { organizationId } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  // Attach product names to the top-sellers list.
  const topProducts = await Promise.all(
    topItems.map(async (t) => {
      const p = await prisma.product.findUnique({ where: { id: t.productId }, select: { name: true, sku: true } });
      return {
        productId: t.productId,
        name: p?.name ?? 'Deleted product',
        sku: p?.sku ?? null,
        unitsSold: t._sum.quantity ?? 0,
        revenue: t._sum.lineTotal ?? 0,
      };
    }),
  );

  res.json({
    success: true,
    data: {
      totals: {
        revenue: revenueAgg._sum.total ?? 0, // paise
        orders: orderCount,
        products: productCount,
        lowStockCount: lowStock.length,
      },
      today: {
        revenue: todayAgg._sum.total ?? 0,
        orders: todayAgg._count._all,
      },
      topProducts,
      lowStock,
    },
  });
});
