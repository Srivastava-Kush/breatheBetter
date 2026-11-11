import cron from 'node-cron';
import { syncIndianLocations } from '../services/location.service';
import { Location } from '../models/Location';
import { logger } from '../utils/logger';

// Sync locations every 6 hours and ensure initial seed on startup
export function startLocationSyncJob(): void {
  logger.info('📅 Location sync job registered (every 6 hours)');

  // Run immediate startup sync if MongoDB has fewer than 500 locations (India has ~775 stations)
  Location.countDocuments()
    .then((count) => {
      if (count < 500) {
        logger.info(`Database has only ${count} locations. Triggering full sync from OpenAQ...`);
        syncIndianLocations()
          .then((result) => {
            logger.info(`✅ Initial location sync complete: ${result.synced} synced, ${result.errors} errors`);
          })
          .catch((err) => {
            logger.error('Initial location sync failed:', err);
          });
      } else {
        logger.info(`Database already contains ${count} monitoring stations.`);
      }
    })
    .catch((err) => {
      logger.error('Failed to check location count:', err);
    });

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

