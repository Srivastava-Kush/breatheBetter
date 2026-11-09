import { Observation } from '../models/Observation';
import { Location } from '../models/Location';
import { fetchAllSensorHours } from '../providers/openaq/history.api';
import { normalizeHourlyRecord } from './normalization.service';
import { isDbConnected } from '../config/database';
import { generateMockObservations } from '../mock/mockData';
import { logger } from '../utils/logger';
import { normalizePollutantName } from '../utils/pollutant-map';

export interface HistoryOptions {
  pollutant?: string;
  hours?: number; // 24, 168 (7d), 720 (30d), 2160 (90d)
}

export async function getLocationHistory(
  locationId: number,
  options: HistoryOptions = {}
): Promise<any[]> {
  const hours = options.hours ?? 168; // default 7 days
  const now = new Date();
  const from = new Date(now.getTime() - hours * 60 * 60 * 1000);

  if (!isDbConnected) {
    const mockHist = generateMockObservations(locationId).history;
    let filtered = mockHist.filter((h) => new Date(h.measurementUtc) >= from);
    if (options.pollutant) {
      const normalized = normalizePollutantName(options.pollutant);
      if (normalized) filtered = filtered.filter((h) => h.pollutant === normalized);
    }
    return filtered;
  }

  const query: Record<string, unknown> = {
    locationId,
    measurementType: 'hourly_average',
    measurementUtc: { $gte: from, $lte: now },
  };

  if (options.pollutant) {
    const normalized = normalizePollutantName(options.pollutant);
    if (normalized) query['pollutant'] = normalized;
  }

  const results = await Observation.find(query)
    .sort({ measurementUtc: 1 })
    .select({ pollutant: 1, value: 1, unit: 1, measurementUtc: 1, freshnessStatus: 1 })
    .lean();

  if (results.length === 0) {
    const mockHist = generateMockObservations(locationId).history;
    let filtered = mockHist.filter((h) => new Date(h.measurementUtc) >= from);
    if (options.pollutant) {
      const normalized = normalizePollutantName(options.pollutant);
      if (normalized) filtered = filtered.filter((h) => h.pollutant === normalized);
    }
    return filtered;
  }

  return results;
}

/**
 * Sync historical hourly data from OpenAQ for a specific sensor.
 */
export async function syncSensorHistory(
  sensorId: number,
  locationId: number,
  stationName: string,
  coordinates: { latitude: number; longitude: number },
  datetimeFrom: string,
  datetimeTo: string
): Promise<{ saved: number; skipped: number }> {
  const location = await Location.findOne({ openaqId: locationId });
  if (!location) {
    logger.warn(`Location ${locationId} not found in DB for history sync`);
    return { saved: 0, skipped: 0 };
  }

  const sensor = location.sensors.find((s) => s.id === sensorId);
  if (!sensor) {
    logger.warn(`Sensor ${sensorId} not found in location ${locationId}`);
    return { saved: 0, skipped: 0 };
  }

  const records = await fetchAllSensorHours(sensorId, datetimeFrom, datetimeTo);
  logger.info(`Fetched ${records.length} hourly records for sensor ${sensorId}`);

  let saved = 0;
  let skipped = 0;

  for (const record of records) {
    const normalized = normalizeHourlyRecord(
      record,
      sensorId,
      locationId,
      stationName,
      sensor,
      coordinates
    );
    if (!normalized) {
      skipped++;
      continue;
    }

    try {
      await Observation.findOneAndUpdate(
        {
          sensorId: normalized.sensorId,
          measurementUtc: new Date(normalized.measurementUtc),
          measurementType: 'hourly_average',
        },
        { $set: { ...normalized, measurementUtc: new Date(normalized.measurementUtc) } },
        { upsert: true }
      );
      saved++;
    } catch (err: unknown) {
      const e = err as { code?: number };
      if (e.code === 11000) {
        skipped++;
      } else {
        logger.error(`Failed to save hourly record for sensor ${sensorId}:`, err);
        skipped++;
      }
    }
  }

  return { saved, skipped };
}

