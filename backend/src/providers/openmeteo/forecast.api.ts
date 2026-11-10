import axios from 'axios';
import { env } from '../../config/environment';
import { logger } from '../../utils/logger';

const OPEN_METEO_POLLUTANTS = [
  'pm10',
  'pm2_5',
  'nitrogen_dioxide',
  'sulphur_dioxide',
  'carbon_monoxide',
  'ozone',
  'us_aqi',
  'european_aqi',
  'ammonia',
].join(',');

export interface OpenMeteoForecastHour {
  time: string;
  pm10: number | null;
  pm2_5: number | null;
  nitrogen_dioxide: number | null;
  sulphur_dioxide: number | null;
  carbon_monoxide: number | null;
  ozone: number | null;
  us_aqi: number | null;
  european_aqi: number | null;
  ammonia?: number | null;
}

export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  hourly_units: Record<string, string>;
  hourly: {
    time: string[];
    pm10: number[];
    pm2_5: number[];
    nitrogen_dioxide: number[];
    sulphur_dioxide: number[];
    carbon_monoxide: number[];
    ozone: number[];
    us_aqi: number[];
    european_aqi: number[];
    ammonia?: number[];
  };
}

export async function fetchForecast(
  latitude: number,
  longitude: number,
  forecastDays = 7
): Promise<OpenMeteoForecastHour[] | null> {
  if (!env.openMeteo.enabled) {
    logger.info('Open-Meteo forecast disabled');
    return null;
  }

  try {
    const response = await axios.get<OpenMeteoForecastResponse>(
      `${env.openMeteo.baseUrl}/air-quality`,
      {
        params: {
          latitude,
          longitude,
          hourly: OPEN_METEO_POLLUTANTS,
          forecast_days: forecastDays,
        },
        timeout: 15000,
      }
    );

    const { hourly } = response.data;
    return hourly.time.map((time, i) => ({
      time,
      pm10: hourly.pm10[i] ?? null,
      pm2_5: hourly.pm2_5[i] ?? null,
      nitrogen_dioxide: hourly.nitrogen_dioxide[i] ?? null,
      sulphur_dioxide: hourly.sulphur_dioxide[i] ?? null,
      carbon_monoxide: hourly.carbon_monoxide[i] ?? null,
      ozone: hourly.ozone[i] ?? null,
      us_aqi: hourly.us_aqi[i] ?? null,
      european_aqi: hourly.european_aqi[i] ?? null,
      ammonia: hourly.ammonia ? (hourly.ammonia[i] ?? null) : null,
    }));
  } catch (error) {
    logger.error(`Open-Meteo forecast failed for (${latitude}, ${longitude}):`, error);
    return null;
  }
}

export interface OpenMeteoCurrentReading {
  time: string;
  pm10: number | null;
  pm2_5: number | null;
  nitrogen_dioxide: number | null;
  sulphur_dioxide: number | null;
  carbon_monoxide: number | null;
  ozone: number | null;
  us_aqi: number | null;
  european_aqi: number | null;
  source: 'Open-Meteo Modelled Estimate';
}

/**
 * Fetch current modelled air quality estimate from Open-Meteo.
 * Strictly flagged as a modelled estimate — never confused with physical ground observations.
 */
export async function fetchCurrentModelledAirQuality(
  latitude: number,
  longitude: number
): Promise<OpenMeteoCurrentReading | null> {
  try {
    const response = await axios.get<any>(
      `${env.openMeteo.baseUrl}/air-quality`,
      {
        params: {
          latitude,
          longitude,
          current: OPEN_METEO_POLLUTANTS,
        },
        timeout: 10000,
      }
    );

    const c = response.data?.current;
    if (!c) return null;

    return {
      time: c.time,
      pm10: c.pm10 ?? null,
      pm2_5: c.pm2_5 ?? null,
      nitrogen_dioxide: c.nitrogen_dioxide ?? null,
      sulphur_dioxide: c.sulphur_dioxide ?? null,
      carbon_monoxide: c.carbon_monoxide ? c.carbon_monoxide / 1000 : null, // convert µg/m³ to mg/m³
      ozone: c.ozone ?? null,
      us_aqi: c.us_aqi ?? null,
      european_aqi: c.european_aqi ?? null,
      source: 'Open-Meteo Modelled Estimate',
    };
  } catch (error) {
    logger.error(`Failed to fetch Open-Meteo current modelled reading for (${latitude}, ${longitude}):`, error);
    return null;
  }
}

