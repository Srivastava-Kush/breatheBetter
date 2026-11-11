import { Location, ILocation } from '../models/Location';
import { fetchAllIndianLocations, fetchLocationById, fetchNearbyOpenAQLocations, OpenAQLocation } from '../providers/openaq/locations.api';
import { isDbConnected } from '../config/database';
import { MOCK_LOCATIONS } from '../mock/mockData';
import { filterWithinRadius, isWithinBoundingBox, haversineDistanceKm } from '../utils/geo';
import { logger } from '../utils/logger';

/**
 * Sync all Indian locations from OpenAQ to MongoDB.
 * Uses upsert to avoid duplicates.
 */
export async function syncIndianLocations(): Promise<{ synced: number; errors: number }> {
  if (!isDbConnected) {
    logger.info('DB not connected, skipping OpenAQ location sync to MongoDB');
    return { synced: MOCK_LOCATIONS.length, errors: 0 };
  }
  logger.info('Starting Indian location sync from OpenAQ...');
  let synced = 0;
  let errors = 0;

  try {
    const locations = await fetchAllIndianLocations();
    logger.info(`Fetched ${locations.length} locations from OpenAQ`);

    for (const loc of locations) {
      try {
        await upsertLocation(loc);
        synced++;
      } catch (err) {
        logger.error(`Failed to upsert location ${loc.id}:`, err);
        errors++;
      }
    }
  } catch (err) {
    logger.error('Location sync failed:', err);
    errors++;
  }

  logger.info(`Location sync complete: ${synced} synced, ${errors} errors`);
  return { synced, errors };
}

export async function upsertLocation(loc: OpenAQLocation): Promise<ILocation> {
  return Location.findOneAndUpdate(
    { openaqId: loc.id },
    {
      $set: {
        openaqId: loc.id,
        name: loc.name,
        locality: loc.locality ?? null,
        timezone: loc.timezone,
        country: loc.country,
        owner: loc.owner ?? null,
        provider: loc.provider ?? null,
        isMobile: loc.isMobile,
        isMonitor: loc.isMonitor,
        coordinates: loc.coordinates,
        sensors: loc.sensors,
        licenses: loc.licenses ?? [],
        lastSyncedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  ) as unknown as ILocation;
}

export async function getLocationById(locationId: number): Promise<ILocation | any | null> {
  if (!isDbConnected) {
    const found = MOCK_LOCATIONS.find((l) => l.openaqId === locationId);
    return found ?? MOCK_LOCATIONS[0];
  }

  let location: ILocation | null = null;
  try {
    location = (await Location.findOne({ openaqId: locationId })) as ILocation | null;
  } catch (err) {
    logger.debug(`DB lookup failed for location ${locationId}`);
  }

  if (!location) {
    // Try fetching from OpenAQ if not in DB
    try {
      const raw = await fetchLocationById(locationId);
      if (raw) {
        location = await upsertLocation(raw);
      }
    } catch {
      // Station not found on upstream OpenAQ or network error
    }

    if (!location) {
      // Fallback to local catalogue
      const found = MOCK_LOCATIONS.find((l) => l.openaqId === locationId);
      if (found) return found;
    }
  }
  return location;
}

export async function getLocationsFromDB(options: {
  limit?: number;
  skip?: number;
  country?: string;
  search?: string;
  isMonitor?: boolean;
  isMobile?: boolean;
  bbox?: [number, number, number, number];
}): Promise<{ locations: any[]; total: number }> {
  if (!isDbConnected) {
    let list = [...MOCK_LOCATIONS];
    if (options.country) {
      list = list.filter((l) => !l.country?.code || l.country.code === options.country);
    }
    if (options.isMonitor !== undefined) {
      list = list.filter((l) => l.isMonitor === options.isMonitor);
    }
    if (options.isMobile !== undefined) {
      list = list.filter((l) => l.isMobile === options.isMobile);
    }
    if (options.bbox) {
      const [minLat, minLng, maxLat, maxLng] = options.bbox;
      list = list.filter((l) =>
        isWithinBoundingBox(l.coordinates.latitude, l.coordinates.longitude, minLat, minLng, maxLat, maxLng)
      );
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      list = list.filter((l) => l.name.toLowerCase().includes(q) || (l.locality && l.locality.toLowerCase().includes(q)));
    }
    return {
      locations: list.slice(options.skip ?? 0, (options.skip ?? 0) + (options.limit ?? 100)),
      total: list.length,
    };
  }

  const query: Record<string, unknown> = {};

  if (options.country === 'GLOBAL_ONLY' || options.country === 'international') {
    query['country.code'] = { $ne: 'IN' };
  } else if (options.country) {
    query['country.code'] = options.country;
  }
  if (options.isMonitor !== undefined) query['isMonitor'] = options.isMonitor;
  if (options.isMobile !== undefined) query['isMobile'] = options.isMobile;
  if (options.bbox) {
    const [minLat, minLng, maxLat, maxLng] = options.bbox;
    query['coordinates.latitude'] = { $gte: minLat, $lte: maxLat };
    query['coordinates.longitude'] = { $gte: minLng, $lte: maxLng };
  }
  if (options.search) {
    query['$text'] = { $search: options.search };
  }

  const [locations, total] = await Promise.all([
    Location.find(query)
      .limit(options.limit ?? 100)
      .skip(options.skip ?? 0)
      .sort({ name: 1 }),
    Location.countDocuments(query),
  ]);

  // If DB is empty, provide mock locations
  if (locations.length === 0 && (!options.search || options.search.length === 0)) {
    let fallbackList = [...MOCK_LOCATIONS];
    if (options.bbox) {
      const [minLat, minLng, maxLat, maxLng] = options.bbox;
      fallbackList = fallbackList.filter((l) =>
        isWithinBoundingBox(l.coordinates.latitude, l.coordinates.longitude, minLat, minLng, maxLat, maxLng)
      );
    }
    return { locations: fallbackList.slice(options.skip ?? 0, (options.skip ?? 0) + (options.limit ?? 100)), total: fallbackList.length };
  }

  return { locations, total };
}

export async function getNearbyLocations(
  latitude: number,
  longitude: number,
  radiusKm = 50,
  limit = 20
): Promise<any[]> {
  // 1. Try DB first if connected
  if (isDbConnected) {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

    const candidates = await Location.find({
      'coordinates.latitude': {
        $gte: latitude - latDelta,
        $lte: latitude + latDelta,
      },
      'coordinates.longitude': {
        $gte: longitude - lngDelta,
        $lte: longitude + lngDelta,
      },
    }).limit(200);

    if (candidates.length > 0) {
      const filtered = filterWithinRadius(
        candidates.map((c) => (typeof c.toObject === 'function' ? c.toObject() : c)),
        latitude,
        longitude,
        radiusKm
      );
      if (filtered.length > 0) {
        return filtered.map((item) => ({
          ...item,
          id: item.openaqId,
          openaqId: item.openaqId,
        })).slice(0, limit);
      }
    }
  }

  // 2. Try OpenAQ live API nearby discovery if key configured
  try {
    const liveNearby = await fetchNearbyOpenAQLocations(latitude, longitude, radiusKm * 1000, limit);
    if (liveNearby && liveNearby.length > 0) {
      const mapped = liveNearby.map((loc) => ({
        ...loc,
        id: loc.id,
        openaqId: loc.id,
        distanceKm: Math.round(
          haversineDistanceKm(latitude, longitude, loc.coordinates.latitude, loc.coordinates.longitude) * 10
        ) / 10,
      }));
      return mapped.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0)).slice(0, limit);
    }
  } catch (err) {
    logger.warn('OpenAQ live nearby discovery failed, falling back to database scan:', err);
  }

  // 3. Fallback: Find closest stations anywhere in DB by calculating distance to all stations
  if (isDbConnected) {
    const all = await Location.find({}).limit(500).lean();
    if (all.length > 0) {
      const sorted = all
        .filter((loc) => loc.coordinates?.latitude && loc.coordinates?.longitude)
        .map((loc) => ({
          ...loc,
          id: loc.openaqId,
          openaqId: loc.openaqId,
          distanceKm: haversineDistanceKm(latitude, longitude, loc.coordinates.latitude, loc.coordinates.longitude),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);
      return sorted.slice(0, limit);
    }
  }

  // 4. Fallback to comprehensive in-memory catalogue
  const catalogueFiltered = filterWithinRadius(MOCK_LOCATIONS, latitude, longitude, radiusKm * 2);
  return catalogueFiltered.map((item) => ({
    ...item,
    id: item.openaqId,
    openaqId: item.openaqId,
  })).slice(0, limit);
}

export async function searchLocations(query: string): Promise<any[]> {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();

  if (!isDbConnected) {
    return MOCK_LOCATIONS.filter(
      (l) => l.name.toLowerCase().includes(q) || (l.locality && l.locality.toLowerCase().includes(q))
    ).slice(0, 10);
  }

  const regex = new RegExp(query, 'i');
  const results = await Location.find({
    $or: [{ name: regex }, { locality: regex }],
  })
    .limit(20)
    .sort({ name: 1 });

  if (results.length > 0) return results;

  // Fallback to mock search
  return MOCK_LOCATIONS.filter(
    (l) => l.name.toLowerCase().includes(q) || (l.locality && l.locality.toLowerCase().includes(q))
  ).slice(0, 10);
}

