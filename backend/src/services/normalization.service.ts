import { OpenAQLocation, OpenAQSensor } from '../providers/openaq/locations.api';
import { OpenAQLatestMeasurement } from '../providers/openaq/latest.api';
import { OpenAQHourlyRecord } from '../providers/openaq/history.api';
import { calculateFreshness } from '../utils/freshness';
import { normalizePollutantName } from '../utils/pollutant-map';

export interface NormalizedObservation {
  source: 'OpenAQ';
  locationId: number;
  sensorId: number;
  stationName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  pollutant: string;
  value: number;
  unit: string;
  measurementUtc: string;
  measurementLocal: string;
  fetchedAt: string;
  measurementType: 'ground_observation' | 'hourly_average';
  ageMinutes: number | null;
  freshnessStatus: string;
}

/**
 * Normalize a single latest measurement with sensor context.
 */
export function normalizeLatestMeasurement(
  measurement: OpenAQLatestMeasurement,
  sensor: OpenAQSensor,
  location: OpenAQLocation
): NormalizedObservation | null {
  const pollutantKey = normalizePollutantName(sensor.parameter.name);
  if (!pollutantKey) return null; // Skip non-pollutant parameters for AQI purposes

  const freshness = calculateFreshness(measurement.datetime.utc);

  return {
    source: 'OpenAQ',
    locationId: measurement.locationsId,
    sensorId: measurement.sensorsId,
    stationName: location.name,
    coordinates: {
      latitude: measurement.coordinates?.latitude ?? location.coordinates.latitude,
      longitude: measurement.coordinates?.longitude ?? location.coordinates.longitude,
    },
    pollutant: pollutantKey,
    value: measurement.value,
    unit: sensor.parameter.units,
    measurementUtc: measurement.datetime.utc,
    measurementLocal: measurement.datetime.local,
    fetchedAt: new Date().toISOString(),
    measurementType: 'ground_observation',
    ageMinutes: freshness.ageMinutes,
    freshnessStatus: freshness.status,
  };
}

/**
 * Normalize an hourly historical record.
 */
export function normalizeHourlyRecord(
  record: OpenAQHourlyRecord,
  sensorId: number,
  locationId: number,
  stationName: string,
  sensor: OpenAQSensor,
  coordinates: { latitude: number; longitude: number }
): NormalizedObservation | null {
  const pollutantKey = normalizePollutantName(sensor.parameter.name);
  if (!pollutantKey) return null;

  const periodEnd = record.period.datetimeTo.utc;
  const freshness = calculateFreshness(periodEnd);

  return {
    source: 'OpenAQ',
    locationId,
    sensorId,
    stationName,
    coordinates,
    pollutant: pollutantKey,
    value: record.value,
    unit: sensor.parameter.units,
    measurementUtc: periodEnd,
    measurementLocal: record.period.datetimeTo.local,
    fetchedAt: new Date().toISOString(),
    measurementType: 'hourly_average',
    ageMinutes: freshness.ageMinutes,
    freshnessStatus: freshness.status,
  };
}

/**
 * Group normalized observations by location and pollutant.
 * Returns a station-level summary with all available pollutants.
 */
export function groupByLocationAndPollutant(
  observations: NormalizedObservation[]
): Map<number, Map<string, NormalizedObservation>> {
  const grouped = new Map<number, Map<string, NormalizedObservation>>();

  for (const obs of observations) {
    if (!grouped.has(obs.locationId)) {
      grouped.set(obs.locationId, new Map());
    }
    const existing = grouped.get(obs.locationId)!.get(obs.pollutant);
    // Keep the most recent measurement per pollutant per location
    if (!existing || new Date(obs.measurementUtc) > new Date(existing.measurementUtc)) {
      grouped.get(obs.locationId)!.set(obs.pollutant, obs);
    }
  }

  return grouped;
}

