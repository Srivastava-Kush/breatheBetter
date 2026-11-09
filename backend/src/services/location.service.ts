import { Location, ILocation } from '../models/Location';
import { fetchAllIndianLocations, fetchLocationById, OpenAQLocation } from '../providers/openaq/locations.api';
import { isDbConnected } from '../config/database';
import { MOCK_LOCATIONS } from '../mock/mockData';
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

  let location: ILocation | null = (await Location.findOne({ openaqId: locationId })) as ILocation | null;
  if (!location) {
    // Try fetching from OpenAQ if not in DB
    const raw = await fetchLocationById(locationId);
    if (raw) {
      location = await upsertLocation(raw);
    } else {
      // Fallback to mock if available
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
}): Promise<{ locations: any[]; total: number }> {
  if (!isDbConnected) {
    let list = [...MOCK_LOCATIONS];
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

  if (options.country) query['country.code'] = options.country;
  if (options.isMonitor !== undefined) query['isMonitor'] = options.isMonitor;
  if (options.isMobile !== undefined) query['isMobile'] = options.isMobile;
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
    return { locations: MOCK_LOCATIONS, total: MOCK_LOCATIONS.length };
  }

  return { locations, total };
}

export async function getNearbyLocations(
  latitude: number,
  longitude: number,
  radiusKm = 50,
  limit = 20
): Promise<any[]> {
  if (!isDbConnected) {
    return MOCK_LOCATIONS.slice(0, limit);
  }

  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

  const results = await Location.find({
    'coordinates.latitude': {
      $gte: latitude - latDelta,
      $lte: latitude + latDelta,
    },
    'coordinates.longitude': {
      $gte: longitude - lngDelta,
      $lte: longitude + lngDelta,
    },
  })
    .limit(limit)
    .sort({ name: 1 });

  return results.length > 0 ? results : MOCK_LOCATIONS.slice(0, 5);
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

