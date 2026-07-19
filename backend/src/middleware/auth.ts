import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { Role } from '@prisma/client';

// Populated by requireAuth for every protected route.
export interface AuthContext {
  userId: string;
  organizationId: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing access token'));
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.auth = {
      userId: payload.userId,
      organizationId: payload.organizationId,
      role: payload.role,
    };
    return next();
  } catch {
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
}

// Role-based access control. Usage: router.delete('/:id', requireRole('ADMIN'), ...)
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(ApiError.unauthorized());
    if (!roles.includes(req.auth.role)) {
      return next(ApiError.forbidden('You do not have permission for this action'));
    }
    return next();
  };
}
