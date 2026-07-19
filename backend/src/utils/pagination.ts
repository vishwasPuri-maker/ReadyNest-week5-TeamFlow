import { Request } from 'express';

export interface PageParams {
  page: number;
  limit: number;
  skip: number;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Parses ?page=&limit=&search=&sortBy=&sortOrder= from a list request.
export function getPageParams(req: Request, defaultSort = 'createdAt'): PageParams {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    search: (req.query.search as string)?.trim() ?? '',
    sortBy: (req.query.sortBy as string) || defaultSort,
    sortOrder,
  };
}

export function buildMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}
