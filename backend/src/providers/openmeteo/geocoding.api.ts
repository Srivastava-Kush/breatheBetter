import axios from 'axios';
import { logger } from '../../utils/logger';

export interface GeocodedCity {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  country: string;
  countryCode: string;
  state?: string;
  district?: string;
  timezone: string;
  population?: number;
}

interface OpenMeteoGeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    elevation?: number;
    feature_code?: string;
    country_code: string;
    country: string;
    admin1?: string; // State / Province
    admin2?: string; // District
    admin3?: string;
    timezone: string;
    population?: number;
  }>;
  generationtime_ms?: number;
}

/**
 * Search cities in India (or worldwide with optional countryCode) using Open-Meteo Geocoding API.
 * Free, fast, no API key required.
 */
export async function searchCities(
  query: string,
  countryCode = 'IN',
  count = 10
): Promise<GeocodedCity[]> {
  if (!query || query.trim().length < 2) return [];

  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();

  // Smart city alias expansion (e.g. Panaji is indexed as Panjim in Open-Meteo)
  let searchName = trimmed;
  if (lower === 'panaji' || lower.includes('panaji')) {
    searchName = 'Panjim';
  }

  try {
    const response = await axios.get<OpenMeteoGeocodingResponse>(
      'https://geocoding-api.open-meteo.com/v1/search',
      {
        params: {
          name: searchName,
          countryCode: countryCode || undefined,
          count,
          language: 'en',
          format: 'json',
        },
        timeout: 10000,
      }
    );

    let rawResults = response.data?.results ?? [];

    let results: GeocodedCity[] = rawResults.map((r) => ({
      id: r.id,
      name: r.name === 'Panjim' && (lower.includes('panaji') || lower === 'goa') ? 'Panaji (Panjim)' : r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      elevation: r.elevation,
      country: r.country,
      countryCode: r.country_code,
      state: r.admin1,
      district: r.admin2,
      timezone: r.timezone || 'Asia/Kolkata',
      population: r.population,
    }));

    // If searching 'Goa', ensure Panaji (Goa state capital) is included in results
    if (lower === 'goa' && !results.some((r) => r.state === 'Goa')) {
      results.unshift({
        id: 1260607,
        name: 'Panaji (Goa)',
        latitude: 15.4957,
        longitude: 73.8262,
        elevation: 16,
        country: 'India',
        countryCode: 'IN',
        state: 'Goa',
        district: 'North Goa',
        timezone: 'Asia/Kolkata',
        population: 70991,
      });
    }

    return results;
  } catch (error) {
    logger.error(`Open-Meteo geocoding search failed for query "${query}":`, error);
    return [];
  }
}

