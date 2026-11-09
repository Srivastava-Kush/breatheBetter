import { rateLimitedRequest } from './openaq.client';
import { OpenAQSensor } from './locations.api';
import { logger } from '../../utils/logger';

interface OpenAQSensorsResponse {
  meta: { found: number };
  results: OpenAQSensor[];
}

export async function fetchSensorsByLocation(locationId: number): Promise<OpenAQSensor[]> {
  try {
    const response = await rateLimitedRequest<OpenAQSensorsResponse>({
      method: 'GET',
      url: `/locations/${locationId}/sensors`,
    });
    return response.data.results;
  } catch (error) {
    logger.error(`Failed to fetch sensors for location ${locationId}:`, error);
    return [];
  }
}

