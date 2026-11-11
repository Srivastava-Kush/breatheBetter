import { Observation } from '../models/Observation';
import { AQISnapshot } from '../models/AQISnapshot';
import { Location } from '../models/Location';
import { fetchLatestMeasurements } from '../providers/openaq/latest.api';
import { fetchLocationById } from '../providers/openaq/locations.api';
import { upsertLocation } from './location.service';
import { normalizeLatestMeasurement } from './normalization.service';
import { calculateCPCBAQI } from '../utils/aqi-calculator';
import { AQIPollutant } from '../utils/aqi-calculator';
import { isDbConnected } from '../config/database';
import { logger } from '../utils/logger';

const REQUIRED_HOURS = 24;
const MIN_DATA_POINTS_FOR_AQI = 16;

/**
 * Fetch latest measurements for a location, normalize, save, and calculate AQI.
 */
export async function updateLatestReadings(locationId: number): Promise<void> {
  let location = await Location.findOne({ openaqId: locationId });
  if (!location) {
    try {
      const rawLoc = await fetchLocationById(locationId);
      if (rawLoc) {
        location = (await upsertLocation(rawLoc)) as any;
      }
    } catch {
      // station not found upstream
    }
  }

  if (!location) {
    logger.warn(`Location ${locationId} not found in DB or upstream OpenAQ`);
    return;
  }

  const rawMeasurements = await fetchLatestMeasurements(locationId);
  if (rawMeasurements.length === 0) {
    logger.info(`No measurements returned for location ${locationId}`);
    return;
  }

  // Build sensor map for quick lookup
  const sensorMap = new Map(location.sensors.map((s) => [s.id, s]));

  for (const measurement of rawMeasurements) {
    const sensor = sensorMap.get(measurement.sensorsId);
    if (!sensor) {
      logger.debug(`Unknown sensor ${measurement.sensorsId} at location ${locationId}`);
      continue;
    }

    const normalized = normalizeLatestMeasurement(measurement, sensor, location as unknown as import('../providers/openaq/locations.api').OpenAQLocation);
    if (!normalized) continue;

    try {
      await Observation.findOneAndUpdate(
        {
          sensorId: normalized.sensorId,
          measurementUtc: new Date(normalized.measurementUtc),
          measurementType: normalized.measurementType,
        },
        {
          $set: {
            source: normalized.source,
            locationId: normalized.locationId,
            sensorId: normalized.sensorId,
            stationName: normalized.stationName,
            coordinates: normalized.coordinates,
            pollutant: normalized.pollutant,
            value: normalized.value,
            unit: normalized.unit,
            measurementUtc: new Date(normalized.measurementUtc),
            measurementLocal: normalized.measurementLocal,
            fetchedAt: new Date(),
            measurementType: normalized.measurementType,
            ageMinutes: normalized.ageMinutes,
            freshnessStatus: normalized.freshnessStatus,
          },
        },
        { upsert: true }
      );
    } catch (err: unknown) {
      const e = err as { code?: number };
      if (e.code !== 11000) {
        logger.error(`Failed to save observation for sensor ${normalized.sensorId}:`, err);
      }
    }
  }

  // After saving observations, calculate AQI and update lastSyncedAt
  await calculateAndSaveAQI(locationId, location.name);
  await Location.updateOne({ openaqId: locationId }, { $set: { lastSyncedAt: new Date() } });
}

/**
 * Calculate CPCB AQI for a location using the last 24h of observations.
 */
export async function calculateAndSaveAQI(locationId: number, stationName: string): Promise<void> {
  const now = new Date();
  const periodStart = new Date(now.getTime() - REQUIRED_HOURS * 60 * 60 * 1000);

  // Fetch observations per pollutant from the last 24 hours (includes ground observations and hourly averages)
  const observations = await Observation.find({
    locationId,
    measurementUtc: { $gte: periodStart, $lte: now },
  }).sort({ measurementUtc: -1 });

  // Group by pollutant and compute averages
  const pollutantGroups = new Map<string, number[]>();
  const pollutantUnits = new Map<string, string>();

  for (const obs of observations) {
    if (!pollutantGroups.has(obs.pollutant)) {
      pollutantGroups.set(obs.pollutant, []);
      pollutantUnits.set(obs.pollutant, obs.unit);
    }
    pollutantGroups.get(obs.pollutant)!.push(obs.value);
  }

  // Build input for AQI calculator
  const pollutantData: Partial<Record<AQIPollutant, { value: number; unit: string; dataPointsUsed: number }>> = {};

  for (const [pollutant, values] of pollutantGroups.entries()) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    pollutantData[pollutant as AQIPollutant] = {
      value: avg,
      unit: pollutantUnits.get(pollutant) ?? 'µg/m³',
      dataPointsUsed: values.length,
    };
  }

  const aqiResult = calculateCPCBAQI(pollutantData, { allowInstantaneous: true });

  // Only save if we have at least some sub-index data
  if (aqiResult.subIndices.length === 0) return;

  try {
    await AQISnapshot.create({
      locationId,
      stationName,
      calculationStandard: 'CPCB',
      aqi: aqiResult.isValid ? aqiResult.aqi : 0,
      category: aqiResult.isValid ? aqiResult.category : 'Unknown',
      dominantPollutant: aqiResult.isValid ? aqiResult.dominantPollutant : null,
      subIndices: aqiResult.subIndices
        .filter((s) => s.isValid)
        .map((s) => ({
          pollutant: s.pollutant,
          value: s.concentration,
          subIndex: s.subIndex,
          unit: s.unit,
          averagingPeriodHours: s.averagingPeriodHours,
          dataPointsUsed: s.dataPointsUsed,
        })),
      inputObservationIds: [],
      calculatedAt: now,
      periodStart,
      periodEnd: now,
      isValid: aqiResult.isValid,
      invalidReason: aqiResult.invalidReason,
    });
  } catch (err) {
    logger.debug(`AQI snapshot save error for location ${locationId}:`, err);
  }
}

/**
 * Get the latest AQI snapshot for a location.
 */
export async function getLatestAQI(locationId: number): Promise<any> {
  if (isDbConnected) {
    let snapshot = await AQISnapshot.findOne({ locationId })
      .sort({ calculatedAt: -1 })
      .lean();

    if (!snapshot) {
      try {
        await updateLatestReadings(locationId);
        snapshot = await AQISnapshot.findOne({ locationId })
          .sort({ calculatedAt: -1 })
          .lean();
      } catch (err) {
        logger.debug(`Auto-update on getLatestAQI failed for location ${locationId}:`, err);
      }
    }

    if (snapshot) {
      return snapshot;
    }
  }

  // Truthful offline metadata if station has no current measurements
  let locName = `Station ${locationId}`;
  try {
    const loc = await Location.findOne({ openaqId: locationId }).select({ name: 1 });
    if (loc?.name) locName = loc.name;
  } catch {
    // ignore
  }

  return {
    locationId,
    stationName: locName,
    calculationStandard: 'CPCB',
    aqi: null,
    category: 'Unknown',
    dominantPollutant: null,
    subIndices: [],
    isValid: false,
    invalidReason: 'Live sensor telemetry is currently updating or station is undergoing maintenance.',
    calculatedAt: new Date(),
  };
}

/**
 * Get the latest observations grouped by pollutant for a location.
 */
export async function getLatestPollutants(locationId: number): Promise<Record<string, any>> {
  if (isDbConnected) {
    let obs = await Observation.find({ locationId })
      .sort({ measurementUtc: -1 })
      .lean();

    if (obs.length === 0) {
      try {
        await updateLatestReadings(locationId);
        obs = await Observation.find({ locationId })
          .sort({ measurementUtc: -1 })
          .lean();
      } catch (err) {
        logger.debug(`Auto-update on getLatestPollutants failed for location ${locationId}:`, err);
      }
    }

    if (obs.length > 0) {
      const latest: Record<string, typeof obs[0]> = {};
      for (const o of obs) {
        if (!latest[o.pollutant]) {
          latest[o.pollutant] = o;
        }
      }
      return latest;
    }
  }

  return {};
}

