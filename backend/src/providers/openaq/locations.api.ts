import { rateLimitedRequest } from './openaq.client';
import { logger } from '../../utils/logger';

export interface OpenAQSensor {
  id: number;
  name: string;
  parameter: {
    id: number;
    name: string;
    units: string;
    displayName: string;
  };
}

export interface OpenAQLocation {
  id: number;
  name: string;
  locality: string | null;
  timezone: string;
  country: {
    code: string;
    name: string;
  };
  owner: {
    id: number;
    name: string;
  } | null;
  provider: {
    id: number;
    name: string;
  } | null;
  isMobile: boolean;
  isMonitor: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  sensors: OpenAQSensor[];
  licenses: Array<Record<string, unknown>>;
}

interface OpenAQLocationsMeta {
  name: string;
  page: number;
  limit: number;
  found: number;
}

interface OpenAQLocationsResponse {
  meta: OpenAQLocationsMeta;
  results: OpenAQLocation[];
}

export async function fetchIndianLocations(options: {
  limit?: number;
  page?: number;
  monitor?: boolean;
  mobile?: boolean;
} = {}): Promise<{ meta: OpenAQLocationsMeta; results: OpenAQLocation[] }> {
  const params: Record<string, unknown> = {
    iso: 'IN',
    limit: options.limit ?? 100,
    page: options.page ?? 1,
  };
  if (options.monitor !== undefined) params['monitor'] = options.monitor;
  if (options.mobile !== undefined) params['mobile'] = options.mobile;

  const response = await rateLimitedRequest<OpenAQLocationsResponse>({
    method: 'GET',
    url: '/locations',
    params,
  });

  return response.data;
}

/**
 * Fetch ALL Indian locations with full pagination.
 */
export async function fetchAllIndianLocations(): Promise<OpenAQLocation[]> {
  const allLocations: OpenAQLocation[] = [];
  let page = 1;
  const limit = 100;
  let totalFound = Infinity;

  while (allLocations.length < totalFound) {
    logger.info(`Fetching Indian locations page ${page}...`);
    const { meta, results } = await fetchIndianLocations({ limit, page });
    totalFound = meta.found;

    if (results.length === 0) break;
    allLocations.push(...results);

    logger.info(`Fetched ${allLocations.length} / ${totalFound} locations`);

    if (allLocations.length >= totalFound) break;
    page++;
  }

  return allLocations;
}

export async function fetchLocationById(locationId: number): Promise<OpenAQLocation | null> {
  try {
    const response = await rateLimitedRequest<{ results: OpenAQLocation[] }>({
      method: 'GET',
      url: `/locations/${locationId}`,
    });
    return response.data.results[0] ?? null;
  } catch (error) {
    logger.error(`Failed to fetch location ${locationId}:`, error);
    return null;
  }
}

export async function searchLocationsByCity(city: string, isoCode = 'IN'): Promise<OpenAQLocation[]> {
  try {
    const response = await rateLimitedRequest<OpenAQLocationsResponse>({
      method: 'GET',
      url: '/locations',
      params: { iso: isoCode, limit: 50, page: 1 },
    });
    // Filter locally since OpenAQ doesn't have a city text search param in v3
    const cityLower = city.toLowerCase();
    return response.data.results.filter(
      (loc) =>
        loc.name.toLowerCase().includes(cityLower) ||
        (loc.locality && loc.locality.toLowerCase().includes(cityLower))
    );
  } catch (error) {
    logger.error(`Location search for "${city}" failed:`, error);
    return [];
  }
}

/**
 * Retrieve nearby stations using OpenAQ coordinates query:
 * GET /v3/locations?coordinates={latitude},{longitude}&radius={radiusMeters}&iso=IN&limit=100&page={page}
 */
export async function fetchNearbyOpenAQLocations(
  latitude: number,
  longitude: number,
  radiusMeters = 25000,
  maxLocations = 100
): Promise<OpenAQLocation[]> {
  const allLocations: OpenAQLocation[] = [];
  let page = 1;
  const limit = 100;
  let totalFound = Infinity;

  while (allLocations.length < totalFound && allLocations.length < maxLocations) {
    try {
      const response = await rateLimitedRequest<OpenAQLocationsResponse>({
        method: 'GET',
        url: '/locations',
        params: {
          coordinates: `${latitude},${longitude}`,
          radius: radiusMeters,
          iso: 'IN',
          limit,
          page,
        },
      });

      const { meta, results } = response.data;
      totalFound = meta.found;
      if (!results || results.length === 0) break;

      allLocations.push(...results);
      if (allLocations.length >= totalFound) break;
      page++;
    } catch (error) {
      logger.error(`Nearby OpenAQ location fetch failed for (${latitude}, ${longitude}):`, error);
      break;
    }
  }

  return allLocations;
}

