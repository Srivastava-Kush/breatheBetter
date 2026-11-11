import { Observation } from '../models/Observation';
import { Location } from '../models/Location';
import { fetchAllSensorHours } from '../providers/openaq/history.api';
import { normalizeHourlyRecord } from './normalization.service';
import { isDbConnected } from '../config/database';
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
    return [];
  }

  const query: Record<string, unknown> = {
    locationId,
    measurementUtc: { $gte: from, $lte: now },
  };

  const targetPollutant = options.pollutant ? normalizePollutantName(options.pollutant) : null;
  if (targetPollutant) {
    query['pollutant'] = targetPollutant;
  }

  let results = await Observation.find(query)
    .sort({ measurementUtc: 1 })
    .select({ pollutant: 1, value: 1, unit: 1, measurementUtc: 1, freshnessStatus: 1, sensorId: 1 })
    .lean();

  // If we have sparse or insufficient historical observations:
  // For single pollutant over 24h, expect >= 6; over 168h, >= 24.
  // For all pollutants combined (diurnal matrix), expect >= 36 points.
  const expectedThreshold = targetPollutant
    ? Math.min(24, Math.max(6, Math.floor(hours / 6)))
    : Math.min(72, Math.max(18, Math.floor(hours / 2)));

  if (results.length < expectedThreshold) {
    try {
      const location = await Location.findOne({ openaqId: locationId });
      if (location && location.sensors && location.sensors.length > 0) {
        // Group available sensors by criteria pollutant and pick the most recent (highest ID) sensor
        const sensorsByParam = new Map<string, any>();
        for (const s of location.sensors) {
          const p = normalizePollutantName(s.parameter.name);
          if (!p) continue;
          if (targetPollutant && p !== targetPollutant) continue;

          const existing = sensorsByParam.get(p);
          if (!existing || s.id > existing.id) {
            sensorsByParam.set(p, s);
          }
        }

        const targetSensors = Array.from(sensorsByParam.values());

        for (const sensor of targetSensors) {
          await syncSensorHistory(
            sensor.id,
            locationId,
            location.name,
            location.coordinates,
            from.toISOString(),
            now.toISOString()
          );
        }

        results = await Observation.find(query)
          .sort({ measurementUtc: 1 })
          .select({ pollutant: 1, value: 1, unit: 1, measurementUtc: 1, freshnessStatus: 1, sensorId: 1 })
          .lean();
      }
    } catch (err) {
      logger.debug(`Historical sync attempt failed for location ${locationId}:`, err);
    }
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
  logger.info(`Fetched ${records.length} hourly records for sensor ${sensorId} (${sensor.parameter?.name})`);

  let saved = 0;
  let skipped = 0;
  const bulkOps: any[] = [];

  for (const record of records) {
    const normalized = normalizeHourlyRecord(
      record,
      sensorId,
      locationId,
      stationName,
      sensor,
      coordinates
    );
    if (!normalized || normalized.value == null || isNaN(normalized.value) || normalized.value < 0) {
      skipped++;
      continue;
    }

    bulkOps.push({
      updateOne: {
        filter: {
          sensorId: normalized.sensorId,
          measurementUtc: new Date(normalized.measurementUtc),
          measurementType: 'hourly_average',
        },
        update: {
          $set: {
            ...normalized,
            fetchedAt: new Date(normalized.fetchedAt),
            measurementUtc: new Date(normalized.measurementUtc),
          },
        },
        upsert: true,
      },
    });
  }

  if (bulkOps.length > 0) {
    try {
      const res = await Observation.bulkWrite(bulkOps, { ordered: false });
      saved = (res.upsertedCount || 0) + (res.modifiedCount || 0);
    } catch (err: unknown) {
      logger.error(`Failed to bulk save hourly records for sensor ${sensorId}:`, err);
    }
  }

  return { saved, skipped };
}

