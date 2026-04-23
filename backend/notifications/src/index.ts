import express from 'express';
import { Pool } from 'pg';
import { NotificationRepository } from './repository.js';
import { createNotificationRouter } from './routes.js';
import { evaluateReminderCandidates } from './rules.js';
import { processDeliveryReceipts, sendReminderCandidate } from './worker.js';

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const repository = new NotificationRepository(pool);

app.use('/notifications', createNotificationRouter(repository));

const schedulerIntervalMs = Number(process.env.REMINDER_SCHEDULER_MS || 300000);

setInterval(async () => {
  try {
    const now = new Date();
    const candidates = await evaluateReminderCandidates(pool, now);
    for (const candidate of candidates) {
      const alreadySent = await repository.isDedupeKeyAlreadySent(candidate.dedupeKey);
      if (alreadySent) continue;
      await sendReminderCandidate(repository, candidate);
    }
    await processDeliveryReceipts(repository);
  } catch (error) {
    console.error('Notification scheduler tick failed:', error);
  }
}, schedulerIntervalMs);

const port = Number(process.env.PORT || 8090);
app.listen(port, () => {
  console.log(`Notification service listening on ${port}`);
});
