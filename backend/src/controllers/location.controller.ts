import { Request, Response } from 'express';
import {
  getLocationsFromDB,
  getLocationById,
  getNearbyLocations,
  searchLocations,
  syncIndianLocations,
} from '../services/location.service';
import { getLatestAQI } from '../services/aqi.service';
import { logger } from '../utils/logger';

export async function listLocations(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(parseInt(req.query['limit'] as string || '100', 10), 500);
    const skip = parseInt(req.query['skip'] as string || '0', 10);
    const country = (req.query['country'] as string) || 'IN';
    const search = req.query['search'] as string | undefined;
    const isMonitor = req.query['isMonitor'] !== undefined
      ? req.query['isMonitor'] === 'true'
      : undefined;
    const isMobile = req.query['isMobile'] !== undefined
      ? req.query['isMobile'] === 'true'
      : undefined;

    const { locations, total } = await getLocationsFromDB({
      limit,
      skip,
      country,
      search,
      isMonitor,
      isMobile,
    });

    const locationsWithAqi = await Promise.all(
      locations.map(async (loc: any) => {
        try {
          const aqiSnap = await getLatestAQI(loc.openaqId);
          const raw = typeof loc.toObject === 'function' ? loc.toObject() : loc;
          return {
            ...raw,
            latestAqi: aqiSnap && aqiSnap.isValid ? {
              value: aqiSnap.aqi,
              category: aqiSnap.category,
              dominantPollutant: aqiSnap.dominantPollutant,
            } : null,
          };
        } catch {
          const raw = typeof loc.toObject === 'function' ? loc.toObject() : loc;
          return raw;
        }
      })
    );

    res.json({
      success: true,
      meta: { total, limit, skip },
      data: locationsWithAqi,
    });
  } catch (error) {
    logger.error('listLocations error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve locations' });
  }
}

export async function getLocation(req: Request, res: Response): Promise<void> {
  try {
    const locationId = parseInt(req.params['locationId'] as string, 10);
    if (isNaN(locationId)) {
      res.status(400).json({ success: false, error: 'Invalid location ID' });
      return;
    }

    const location = await getLocationById(locationId);
    if (!location) {
      res.status(404).json({ success: false, error: 'Location not found' });
      return;
    }

    res.json({ success: true, data: location });
  } catch (error) {
    logger.error('getLocation error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve location' });
  }
}

export async function nearbyLocations(req: Request, res: Response): Promise<void> {
  try {
    const lat = parseFloat(req.query['lat'] as string);
    const lng = parseFloat(req.query['lng'] as string);
    const radius = parseFloat(req.query['radius'] as string || '50');
    const limit = parseInt(req.query['limit'] as string || '20', 10);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ success: false, error: 'lat and lng are required' });
      return;
    }

    const locations = await getNearbyLocations(lat, lng, radius, limit);
    res.json({ success: true, data: locations });
  } catch (error) {
    logger.error('nearbyLocations error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve nearby locations' });
  }
}

export async function searchLocationsController(req: Request, res: Response): Promise<void> {
  try {
    const query = req.query['q'] as string;
    if (!query) {
      res.status(400).json({ success: false, error: 'Search query is required' });
      return;
    }

    const results = await searchLocations(query);
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('searchLocations error:', error);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
}

export async function triggerLocationSync(req: Request, res: Response): Promise<void> {
  try {
    logger.info('Manual location sync triggered via API');
    // Run async, return immediately
    syncIndianLocations().catch((err) => logger.error('Background sync error:', err));
    res.json({ success: true, message: 'Location sync started in background' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Sync trigger failed' });
  }
}

