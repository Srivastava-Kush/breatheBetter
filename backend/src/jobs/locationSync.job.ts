import cron from 'node-cron';
import { syncIndianLocations } from '../services/location.service';
import { logger } from '../utils/logger';

// Sync locations every 6 hours
export function startLocationSyncJob(): void {
  logger.info('📅 Location sync job registered (every 6 hours)');

  cron.schedule('0 */6 * * *', async () => {
    logger.info('🔄 Running scheduled location sync...');
    try {
      const result = await syncIndianLocations();
      logger.info(`✅ Location sync done: ${result.synced} synced, ${result.errors} errors`);
    } catch (err) {
      logger.error('Location sync job failed:', err);
    }
  });
}

