import cron from 'node-cron';
import pLimit from 'p-limit';
import { Location } from '../models/Location';
import { updateLatestReadings } from '../services/aqi.service';
import { logger } from '../utils/logger';

const CONCURRENCY = 3; // max 3 simultaneous location updates (rate-limit aware)

// Update latest readings every 30 minutes
export function startLatestReadingsJob(): void {
  logger.info('📅 Latest readings job registered (every 30 minutes)');

  cron.schedule('*/30 * * * *', async () => {
    logger.info('🔄 Running latest readings update...');
    try {
      // Only update non-mobile, monitoring stations (prioritize them)
      const locations = await Location.find({ isMobile: false })
        .sort({ lastSyncedAt: 1 })
        .limit(50)
        .select({ openaqId: 1 });

      const limit = pLimit(CONCURRENCY);
      const tasks = locations.map((loc) =>
        limit(() =>
          updateLatestReadings(loc.openaqId).catch((err) =>
            logger.error(`Failed to update location ${loc.openaqId}:`, err)
          )
        )
      );

      await Promise.all(tasks);
      logger.info(`✅ Latest readings updated for ${locations.length} locations`);
    } catch (err) {
      logger.error('Latest readings job failed:', err);
    }
  });
}

