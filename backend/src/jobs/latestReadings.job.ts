import cron from 'node-cron';
import pLimit from 'p-limit';
import { Location } from '../models/Location';
import { updateLatestReadings } from '../services/aqi.service';
import { logger } from '../utils/logger';

const CONCURRENCY = 1; // 1 sequential location update to respect 60 req/min rate limit cleanly

async function runUpdateBatch(batchSize = 25): Promise<void> {
  try {
    const locations = await Location.find({ isMobile: false })
      .sort({ lastSyncedAt: 1 })
      .limit(batchSize)
      .select({ openaqId: 1 });

    const limit = pLimit(CONCURRENCY);
    const tasks = locations.map((loc) =>
      limit(async () => {
        try {
          await updateLatestReadings(loc.openaqId);
        } catch (err) {
          logger.debug(`Station ${loc.openaqId} update:`, err);
        }
      })
    );

    await Promise.all(tasks);
    logger.info(`✅ Latest readings updated for ${locations.length} locations`);
  } catch (err) {
    logger.error('Latest readings update failed:', err);
  }
}

// Update latest readings every 5 minutes and run immediate startup batch
export function startLatestReadingsJob(): void {
  logger.info('📅 Latest readings job registered (every 5 minutes)');

  // Run initial batch shortly after startup
  setTimeout(() => {
    runUpdateBatch(20).catch((err) => logger.debug('Initial readings sync error:', err));
  }, 4000);

  cron.schedule('*/5 * * * *', async () => {
    logger.info('🔄 Running scheduled latest readings update...');
    await runUpdateBatch(25);
  });
}

