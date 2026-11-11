import { rateLimitedRequest } from './openaq.client';
import { logger } from '../../utils/logger';

export interface OpenAQHourlyRecord {
  period: {
    datetimeFrom: { utc: string; local: string };
    datetimeTo: { utc: string; local: string };
  };
  value: number;
  coverage?: {
    percentComplete: number;
    percentCoverage: number;
    datetimeFrom?: { utc: string; local: string };
    datetimeTo?: { utc: string; local: string };
    expectedCount?: number;
    observedCount?: number;
  };
  parameter?: {
    id: number;
    name: string;
    units: string;
    displayName: string;
  };
  sensorsId?: number;
  locationsId?: number;
}

interface OpenAQHoursResponse {
  meta: {
    name: string;
    page: number;
    limit: number;
    found: number;
  };
  results: OpenAQHourlyRecord[];
}

export async function fetchSensorHours(
  sensorId: number,
  options: {
    datetimeFrom?: string;
    datetimeTo?: string;
    limit?: number;
    page?: number;
  } = {}
): Promise<{ meta: OpenAQHoursResponse['meta']; results: OpenAQHourlyRecord[] }> {
  const params: Record<string, unknown> = {
    limit: options.limit ?? 100,
    page: options.page ?? 1,
  };
  if (options.datetimeFrom) params['datetime_from'] = options.datetimeFrom;
  if (options.datetimeTo) params['datetime_to'] = options.datetimeTo;

  const response = await rateLimitedRequest<OpenAQHoursResponse>({
    method: 'GET',
    url: `/sensors/${sensorId}/hours`,
    params,
  });

  return response.data;
}

/**
 * Fetch all hourly records for a sensor in a date range, handling pagination.
 */
export async function fetchAllSensorHours(
  sensorId: number,
  datetimeFrom: string,
  datetimeTo: string,
  maxPages = 10
): Promise<OpenAQHourlyRecord[]> {
  const allRecords: OpenAQHourlyRecord[] = [];
  let page = 1;
  const limit = 100;

  while (page <= maxPages) {
    try {
      const { meta, results } = await fetchSensorHours(sensorId, {
        datetimeFrom,
        datetimeTo,
        limit,
        page,
      });

      if (!results || results.length === 0) break;
      allRecords.push(...results);

      // Reached the end if fewer records than page limit returned
      if (results.length < limit) break;

      const foundStr = String(meta?.found ?? '');
      if (!foundStr.includes('>')) {
        const numericFound =
          typeof meta?.found === 'number'
            ? meta.found
            : parseInt(foundStr.replace(/\D/g, ''), 10) || Infinity;

        if (allRecords.length >= numericFound) break;
      }

      page++;
    } catch (error) {
      logger.error(`Failed to fetch page ${page} for sensor ${sensorId}:`, error);
      break;
    }
  }

  return allRecords;
}

