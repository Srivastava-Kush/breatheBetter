import { rateLimitedRequest } from './openaq.client';
import { logger } from '../../utils/logger';

export interface OpenAQLatestMeasurement {
  datetime: {
    utc: string;
    local: string;
  };
  value: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  sensorsId: number;
  locationsId: number;
  parameter?: {
    id: number;
    name: string;
    units: string;
    displayName: string;
  };
}

interface OpenAQLatestResponse {
  meta: {
    name: string;
    page: number;
    limit: number;
    found: number;
  };
  results: OpenAQLatestMeasurement[];
}

// In-memory cache for location latest readings with 15-minute TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const latestCache = new Map<number, CacheEntry<OpenAQLatestMeasurement[]>>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Fetch latest measurements for a specific location.
 * Cached for 15 minutes to respect OpenAQ rate limits.
 */
export async function fetchLatestMeasurements(
  locationId: number,
  forceRefresh = false
): Promise<OpenAQLatestMeasurement[]> {
  const cached = latestCache.get(locationId);
  const now = Date.now();

  if (!forceRefresh && cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  try {
    const response = await rateLimitedRequest<OpenAQLatestResponse>({
      method: 'GET',
      url: `/locations/${locationId}/latest`,
      params: { limit: 100 },
    });

    const results = response.data?.results ?? [];
    latestCache.set(locationId, { data: results, timestamp: now });
    return results;
  } catch (error) {
    logger.error(`Failed to fetch latest measurements for location ${locationId}:`, error);
    if (cached) return cached.data; // Serve stale cache on failure
    return [];
  }
}

/**
 * OpenAQ Parameter IDs for criteria pollutants:
 * PM2.5 = 2, PM10 = 1, NO2 = 5, SO2 = 9, CO = 8, O3 = 7, NH3 = 19
 */
export const CRITERIA_PARAMETER_IDS: Record<string, number> = {
  pm25: 2,
  pm10: 1,
  no2: 5,
  so2: 9,
  co: 8,
  o3: 7,
  nh3: 19,
};

/**
 * Bulk Parameter Latest Investigation & Implementation:
 *
 * Analysis of `GET /v3/parameters/{parameter_id}/latest` vs `GET /v3/locations/{id}/latest`:
 * --------------------------------------------------------------------------------------
 * 1. Per-Location Method (`/locations/{id}/latest`):
 *    - Pros: Returns all pollutants for that station in a single call.
 *    - Cons: With 700+ Indian stations, syncing every station requires 700 HTTP requests.
 *      At 60 req/min, this takes ~12 minutes and consumes 35% of the 2,000 req/hour limit.
 *
 * 2. Bulk Parameter Method (`/parameters/{id}/latest?iso=IN`):
 *    - Pros: Fetches latest measurements for an entire pollutant across ALL Indian stations
 *      in paginated chunks (100 per page, ~7 pages per pollutant).
 *    - Cons: Requires aggregating measurements across 6-7 pollutant calls to assemble a station's complete profile.
 *
 * Strategy adopted:
 * - Hybrid optimal approach:
 *   a) Use on-demand cached `/locations/{id}/latest` with 15-minute in-memory TTL for targeted station/city queries.
 *   b) Use `/parameters/{parameter_id}/latest` for background bulk fleet sync when updating nationwide maps.
 */
export async function fetchBulkParameterLatest(
  parameterId: number,
  iso = 'IN',
  limit = 100
): Promise<OpenAQLatestMeasurement[]> {
  try {
    const response = await rateLimitedRequest<OpenAQLatestResponse>({
      method: 'GET',
      url: `/parameters/${parameterId}/latest`,
      params: { iso, limit },
    });
    return response.data?.results ?? [];
  } catch (error) {
    logger.error(`Bulk latest fetch failed for parameter ${parameterId}:`, error);
    return [];
  }
}
