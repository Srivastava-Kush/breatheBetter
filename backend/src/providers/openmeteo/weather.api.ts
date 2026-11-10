import axios from 'axios';
import { logger } from '../../utils/logger';

export interface CurrentWeather {
  temperatureC: number;
  relativeHumidity: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  surfacePressureHpa: number;
  weatherCode: number;
  weatherDescription: string;
  dispersionConditions: 'favorable' | 'moderate' | 'poor' | 'stagnant';
  dispersionExplanation: string;
}

const WEATHER_CODE_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  80: 'Rain showers',
  95: 'Thunderstorm',
};

/**
 * Fetch real-time meteorological conditions from Open-Meteo Weather API.
 * Combines authentic meteorological data with atmospheric air-quality observations.
 */
export async function fetchCurrentWeather(
  latitude: number,
  longitude: number
): Promise<CurrentWeather | null> {
  try {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude,
        longitude,
        current: [
          'temperature_2m',
          'relative_humidity_2m',
          'wind_speed_10m',
          'wind_direction_10m',
          'surface_pressure',
          'weather_code',
        ].join(','),
      },
      timeout: 10000,
    });

    const c = response.data?.current;
    if (!c) return null;

    const windSpeed = c.wind_speed_10m ?? 0;
    const humidity = c.relative_humidity_2m ?? 50;

    // Evaluate atmospheric dispersion capacity
    let dispersionConditions: CurrentWeather['dispersionConditions'] = 'moderate';
    let dispersionExplanation = '';

    if (windSpeed < 5) {
      dispersionConditions = 'stagnant';
      dispersionExplanation =
        'Calm surface winds (< 5 km/h) are causing thermal stagnation, trapping particulate matter near ground level.';
    } else if (windSpeed < 12) {
      dispersionConditions = 'poor';
      dispersionExplanation =
        'Light winds offer limited horizontal ventilation, leading to local pollutant accumulation.';
    } else if (windSpeed < 25) {
      dispersionConditions = 'moderate';
      dispersionExplanation =
        'Moderate breeze supports continuous dispersal of urban emissions.';
    } else {
      dispersionConditions = 'favorable';
      dispersionExplanation =
        'Strong winds (> 25 km/h) are actively clearing particulate concentrations, promoting rapid atmospheric mixing.';
    }

    if (humidity > 80 && dispersionConditions !== 'favorable') {
      dispersionExplanation += ' High relative humidity accelerates hygroscopic aerosol swelling and secondary particulate formation.';
    }

    const code = c.weather_code ?? 0;

    return {
      temperatureC: Math.round((c.temperature_2m ?? 25) * 10) / 10,
      relativeHumidity: Math.round(humidity),
      windSpeedKmh: Math.round(windSpeed * 10) / 10,
      windDirectionDeg: Math.round(c.wind_direction_10m ?? 0),
      surfacePressureHpa: Math.round(c.surface_pressure ?? 1013),
      weatherCode: code,
      weatherDescription: WEATHER_CODE_DESCRIPTIONS[code] || 'Clear',
      dispersionConditions,
      dispersionExplanation,
    };
  } catch (error) {
    logger.warn(`Open-Meteo weather fetch failed for (${latitude}, ${longitude}):`, error);
    return null;
  }
}

