import { Request, Response } from 'express';
import {
  getLocationsFromDB,
  getLocationById,
  getNearbyLocations,
  searchLocations,
  syncIndianLocations,
} from '../services/location.service';
import { AQISnapshot } from '../models/AQISnapshot';
import { isDbConnected } from '../config/database';
import { apiCache } from '../utils/cache';
import { logger } from '../utils/logger';

export async function listLocations(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(parseInt((req.query['limit'] as string) || '100', 10), 1000);
    const skip = parseInt((req.query['skip'] as string) || '0', 10);
    const countryQuery = req.query['country'] as string | undefined;
    const country =
      countryQuery === 'ALL' || countryQuery === 'global' || countryQuery === 'all'
        ? undefined
        : countryQuery === 'GLOBAL_ONLY' || countryQuery === 'international'
        ? 'GLOBAL_ONLY'
        : (countryQuery || 'IN');
    const search = req.query['search'] as string | undefined;
    const isMonitor = req.query['isMonitor'] !== undefined
      ? req.query['isMonitor'] === 'true'
      : undefined;
    const isMobile = req.query['isMobile'] !== undefined
      ? req.query['isMobile'] === 'true'
      : undefined;

    let bbox: [number, number, number, number] | undefined;
    if (req.query['bbox']) {
      const parts = (req.query['bbox'] as string).split(',').map((p) => parseFloat(p.trim()));
      if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
        bbox = parts as [number, number, number, number];
      }
    }

    const cacheKey = `locations:${country || 'all'}:${limit}:${skip}:${search || ''}:${req.query['bbox'] || ''}`;
    const cached = apiCache.get<any>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const { locations, total } = await getLocationsFromDB({
      limit,
      skip,
      country,
      search,
      isMonitor,
      isMobile,
      bbox,
    });

    // Batch lookup AQI snapshots in a single DB query
    const locIds = locations.map((l: any) => l.openaqId);
    const snapshotMap = new Map<number, any>();

    if (isDbConnected && locIds.length > 0) {
      const snapshots = await AQISnapshot.find({ locationId: { $in: locIds } })
        .sort({ calculatedAt: -1 })
        .lean();
      for (const s of snapshots) {
        if (!snapshotMap.has(s.locationId)) {
          snapshotMap.set(s.locationId, s);
        }
      }
    }

    const locationsWithAqi = locations.map((loc: any) => {
      const raw = typeof loc.toObject === 'function' ? loc.toObject() : loc;
      const aqiSnap = snapshotMap.get(loc.openaqId);
      return {
        ...raw,
        latestAqi: aqiSnap && aqiSnap.isValid ? {
          value: aqiSnap.aqi,
          category: aqiSnap.category,
          dominantPollutant: aqiSnap.dominantPollutant,
        } : null,
      };
    });

    const payload = {
      success: true,
      meta: { total, limit, skip },
      data: locationsWithAqi,
    };

    apiCache.set(cacheKey, payload, 300); // 5 min TTL
    res.json(payload);
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

    const cacheKey = `loc:${locationId}`;
    const cached = apiCache.get<any>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const location = await getLocationById(locationId);
    if (!location) {
      res.status(404).json({ success: false, error: 'Location not found' });
      return;
    }

    const payload = { success: true, data: location };
    apiCache.set(cacheKey, payload, 600);
    res.json(payload);
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
    apiCache.flush();
    syncIndianLocations().catch((err) => logger.error('Background sync error:', err));
    res.json({ success: true, message: 'Location sync started in background' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Sync trigger failed' });
  }
}

