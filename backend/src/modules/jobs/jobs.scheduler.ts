import cron from 'node-cron';
import { runOverdueDigest, runTokenCleanup } from './jobs.service';

// Registers the recurring background jobs. Called once at server startup.
export function startScheduledJobs() {
  // Token cleanup — every day at 03:00 (server time).
  cron.schedule('0 3 * * *', async () => {
    try {
      const r = await runTokenCleanup();
      console.log(`[cron] ${r.summary}`);
    } catch (err) {
      console.error('[cron] token-cleanup failed:', err);
    }
  });

  // Overdue-task digest email — every weekday at 08:00.
  cron.schedule('0 8 * * 1-5', async () => {
    try {
      const r = await runOverdueDigest();
      console.log(`[cron] ${r.summary}`);
    } catch (err) {
      console.error('[cron] overdue-digest failed:', err);
    }
  });

  console.log('⏱  Scheduled jobs registered (token-cleanup @03:00, overdue-digest @08:00 Mon–Fri)');
}
