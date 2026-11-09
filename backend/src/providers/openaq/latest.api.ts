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

export async function fetchLatestMeasurements(
  locationId: number
): Promise<OpenAQLatestMeasurement[]> {
  try {
    const response = await rateLimitedRequest<OpenAQLatestResponse>({
      method: 'GET',
      url: `/locations/${locationId}/latest`,
      params: { limit: 100 },
    });
    return response.data.results;
  } catch (error) {
    logger.error(`Failed to fetch latest measurements for location ${locationId}:`, error);
    return [];
  }
}

