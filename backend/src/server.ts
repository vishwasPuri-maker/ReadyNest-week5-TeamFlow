import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { initSocket } from './sockets/io';
import { prisma } from './config/prisma';
import { startScheduledJobs } from './modules/jobs/jobs.scheduler';

async function main() {
  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);
  startScheduledJobs();

  server.listen(env.port, () => {
    console.log(`🚀 TeamFlow API running on http://localhost:${env.port}`);
    console.log(`   WebSocket ready • CORS origin: ${env.clientUrl}`);
  });

  const shutdown = async () => {
    console.log('\nShutting down...');
    await prisma.$disconnect();
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
