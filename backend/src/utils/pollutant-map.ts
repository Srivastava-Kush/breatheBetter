/**
 * Canonical set of recognized air quality pollutant parameter names.
 * Maps from various OpenAQ API names to our internal standardized names.
 */

export type PollutantKey = 'pm25' | 'pm10' | 'no2' | 'so2' | 'co' | 'o3' | 'nh3';
export type EnvironmentalKey = 'temperature' | 'humidity' | 'wind_speed' | 'wind_direction' | 'pressure';

const POLLUTANT_NAME_MAP: Record<string, PollutantKey> = {
  'pm25': 'pm25',
  'pm2.5': 'pm25',
  'pm 2.5': 'pm25',
  'pm10': 'pm10',
  'pm 10': 'pm10',
  'no2': 'no2',
  'nitrogen dioxide': 'no2',
  'nitrogen_dioxide': 'no2',
  'so2': 'so2',
  'sulphur dioxide': 'so2',
  'sulphur_dioxide': 'so2',
  'sulfur dioxide': 'so2',
  'co': 'co',
  'carbon monoxide': 'co',
  'carbon_monoxide': 'co',
  'o3': 'o3',
  'ozone': 'o3',
  'nh3': 'nh3',
  'ammonia': 'nh3',
};

const ENVIRONMENTAL_NAME_MAP: Record<string, EnvironmentalKey> = {
  'temperature': 'temperature',
  'humidity': 'humidity',
  'relativehumidity': 'humidity',
  'wind_speed': 'wind_speed',
  'wind speed': 'wind_speed',
  'windspeed': 'wind_speed',
  'wind_direction': 'wind_direction',
  'pressure': 'pressure',
  'barometric pressure': 'pressure',
};

export function normalizePollutantName(rawName: string): PollutantKey | null {
  const normalized = rawName.toLowerCase().trim();
  return POLLUTANT_NAME_MAP[normalized] ?? null;
}

export function normalizeEnvironmentalName(rawName: string): EnvironmentalKey | null {
  const normalized = rawName.toLowerCase().trim().replace(/\s+/g, '_');
  return ENVIRONMENTAL_NAME_MAP[normalized] ?? null;
}

export function isPollutant(rawName: string): boolean {
  return normalizePollutantName(rawName) !== null;
}

export function isEnvironmentalParameter(rawName: string): boolean {
  return normalizeEnvironmentalName(rawName) !== null;
}

/** All AQI-relevant pollutants in priority order */
export const AQI_POLLUTANTS: PollutantKey[] = ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3', 'nh3'];

