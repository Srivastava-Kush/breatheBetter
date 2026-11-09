import { fetchForecast } from '../providers/openmeteo/forecast.api';
import { logger } from '../utils/logger';
import { calculateCPCBAQI } from '../utils/aqi-calculator';
import { AQIPollutant } from '../utils/aqi-calculator';

export interface ForecastHour {
  time: string;
  pollutants: {
    pm25: number | null;
    pm10: number | null;
    no2: number | null;
    so2: number | null;
    co: number | null;
    o3: number | null;
    nh3: number | null;
  };
  usAqi: number | null;
  europeanAqi: number | null;
  source: 'open-meteo';
  dataType: 'forecast';
}

export async function getForecast(
  locationId: number,
  latitude: number,
  longitude: number,
  forecastDays = 7
): Promise<{ hours: ForecastHour[]; disclaimer: string } | null> {
  try {
    const rawForecast = await fetchForecast(latitude, longitude, forecastDays);
    if (!rawForecast) return null;

    const hours: ForecastHour[] = rawForecast.map((h) => ({
      time: h.time,
      pollutants: {
        pm25: h.pm2_5,
        pm10: h.pm10,
        no2: h.nitrogen_dioxide,
        so2: h.sulphur_dioxide,
        co: h.carbon_monoxide != null ? h.carbon_monoxide / 1000 : null, // convert µg/m³ to mg/m³
        o3: h.ozone,
        nh3: h.ammonia ?? null,
      },
      usAqi: h.us_aqi,
      europeanAqi: h.european_aqi,
      source: 'open-meteo',
      dataType: 'forecast',
    }));

    return {
      hours,
      disclaimer:
        'Forecast data is a modelled estimate from Open-Meteo. It is not an official government reading.',
    };
  } catch (error) {
    logger.error(`Forecast fetch failed for location ${locationId}:`, error);
    return null;
  }
}

