import { Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/error';

import authRoutes from './modules/auth/auth.routes';
import projectRoutes from './modules/projects/projects.routes';
import taskRoutes from './modules/tasks/tasks.routes';
import memberRoutes from './modules/users/users.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import uploadRoutes from './modules/uploads/uploads.routes';
import jobRoutes from './modules/jobs/jobs.routes';
import productRoutes from './modules/products/products.routes';
import orderRoutes from './modules/orders/orders.routes';
import storeRoutes from './modules/store/store.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  // Global API rate limit (per IP).
  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get('/api/health', (_req: Request, res: Response) =>
    res.json({ success: true, status: 'ok', time: new Date().toISOString() }),
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/store', storeRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
