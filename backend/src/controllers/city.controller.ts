import { Request, Response } from 'express';
import { searchCities } from '../providers/openmeteo/geocoding.api';
import { fetchCurrentModelledAirQuality } from '../providers/openmeteo/forecast.api';
import { getNearbyLocations } from '../services/location.service';
import { getLatestAQI } from '../services/aqi.service';
import { logger } from '../utils/logger';

/**
 * GET /api/cities/search?q={query}&countryCode=IN
 * Search Indian cities using Open-Meteo Geocoding API.
 */
export async function searchCitiesHandler(req: Request, res: Response): Promise<void> {
  try {
    const query = req.query['q'] as string;
    const countryCode = (req.query['countryCode'] as string) || 'IN';

    if (!query || query.trim().length < 2) {
      res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long',
      });
      return;
    }

    const cities = await searchCities(query, countryCode, 10);
    res.json({
      success: true,
      meta: { count: cities.length, query },
      data: cities,
    });
  } catch (error) {
    logger.error('City search failed:', error);
    res.status(500).json({ success: false, error: 'Failed to search cities' });
  }
}

/**
 * GET /api/cities/air-quality?lat={lat}&lng={lng}&radius={km}&name={cityName}&state={stateName}
 * City-based Air Quality View:
 * 1. Discovers all nearby ground monitoring stations within radius (default 25 km).
 * 2. Fetches individual station measurements and calculated CPCB AQIs.
 * 3. Never silently averages stations.
 * 4. Provides modelled fallback via Open-Meteo if no ground stations exist.
 */
export async function getCityAirQualityHandler(req: Request, res: Response): Promise<void> {
  try {
    const lat = parseFloat(req.query['lat'] as string);
    const lng = parseFloat(req.query['lng'] as string);
    const radius = parseFloat((req.query['radius'] as string) || '25');
    const cityName = (req.query['name'] as string) || 'Selected Location';
    const stateName = req.query['state'] as string | undefined;

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({
        success: false,
        error: 'Valid lat and lng query parameters are required',
      });
      return;
    }

    // 1. Discover nearby ground stations
    const nearbyStations = await getNearbyLocations(lat, lng, radius, 20);

    // 2. Fetch measurements & calculated AQI for each station
    const stationsData = await Promise.all(
      nearbyStations.map(async (station: any) => {
        const stationId = station.openaqId || station.id;
        try {
          const aqiResult = await getLatestAQI(stationId);
          return {
            id: stationId,
            name: station.name,
            locality: station.locality || null,
            coordinates: station.coordinates,
            distanceKm: station.distanceKm ?? null,
            isMonitor: station.isMonitor ?? false,
            provider: station.provider?.name || 'CPCB / SPCB',
            sensors: station.sensors || [],
            aqi: aqiResult && aqiResult.isValid ? aqiResult.aqi : null,
            aqiCategory: aqiResult && aqiResult.isValid ? aqiResult.category : null,
            dominantPollutant: aqiResult && aqiResult.isValid ? aqiResult.dominantPollutant : null,
            subIndices: aqiResult ? aqiResult.subIndices : {},
            pollutants: aqiResult ? aqiResult.measurements : {},
            isValidAqi: aqiResult ? aqiResult.isValid : false,
            dataFreshness: aqiResult?.timestamp || station.lastSyncedAt || new Date().toISOString(),
          };
        } catch (err) {
          return {
            id: stationId,
            name: station.name,
            locality: station.locality || null,
            coordinates: station.coordinates,
            distanceKm: station.distanceKm ?? null,
            isMonitor: station.isMonitor ?? false,
            provider: station.provider?.name || 'Unknown',
            sensors: station.sensors || [],
            aqi: null,
            aqiCategory: null,
            dominantPollutant: null,
            subIndices: {},
            pollutants: {},
            isValidAqi: false,
            dataFreshness: station.lastSyncedAt || new Date().toISOString(),
          };
        }
      })
    );

    // 3. Station statistics & Overview (Strictly no fake averaging)
    const validAqiStations = stationsData.filter((s) => s.isValidAqi && s.aqi !== null);
    const stationsWithRecentData = stationsData.filter((s) => {
      const msAgo = Date.now() - new Date(s.dataFreshness).getTime();
      return msAgo <= 24 * 60 * 60 * 1000;
    });

    const uniquePollutants = Array.from(
      new Set(
        stationsData.flatMap((s) =>
          s.sensors?.map((sn: any) => sn.parameter?.name?.toLowerCase() || sn.name?.toLowerCase()) || []
        )
      )
    ).filter(Boolean);

    let aqiMin: number | null = null;
    let aqiMax: number | null = null;
    if (validAqiStations.length > 0) {
      const aqiVals = validAqiStations.map((s) => s.aqi as number);
      aqiMin = Math.min(...aqiVals);
      aqiMax = Math.max(...aqiVals);
    }

    // 4. If no ground stations exist within radius, search for nearest alternatives across the region
    let modelledFallback = null;
    let nearestAlternativeStations: any[] = [];
    let noStationMessage: string | null = null;

    if (stationsData.length === 0) {
      const regionLabel = stateName && stateName.toLowerCase().includes('goa') ? 'Goa' : (stateName || cityName);
      noStationMessage = `No ground station was found in ${regionLabel} on the OpenAQ platform as of now.`;

      // Expand search up to 350km to locate the nearest available ground stations
      const alternativeCandidates = await getNearbyLocations(lat, lng, 350, 5);
      nearestAlternativeStations = await Promise.all(
        alternativeCandidates.map(async (alt: any) => {
          const altId = alt.openaqId || alt.id;
          try {
            const aqiRes = await getLatestAQI(altId);
            return {
              id: altId,
              name: alt.name,
              locality: alt.locality || null,
              coordinates: alt.coordinates,
              distanceKm: alt.distanceKm ?? null,
              isMonitor: alt.isMonitor ?? false,
              provider: alt.provider?.name || 'CPCB / SPCB',
              sensors: alt.sensors || [],
              aqi: aqiRes && aqiRes.isValid ? aqiRes.aqi : null,
              aqiCategory: aqiRes && aqiRes.isValid ? aqiRes.category : null,
              dominantPollutant: aqiRes && aqiRes.isValid ? aqiRes.dominantPollutant : null,
              isValidAqi: aqiRes ? aqiRes.isValid : false,
              dataFreshness: aqiRes?.timestamp || alt.lastSyncedAt || new Date().toISOString(),
            };
          } catch {
            return {
              id: altId,
              name: alt.name,
              locality: alt.locality || null,
              coordinates: alt.coordinates,
              distanceKm: alt.distanceKm ?? null,
              isMonitor: alt.isMonitor ?? false,
              provider: alt.provider?.name || 'Unknown',
              sensors: alt.sensors || [],
              aqi: null,
              aqiCategory: null,
              dominantPollutant: null,
              isValidAqi: false,
              dataFreshness: alt.lastSyncedAt || new Date().toISOString(),
            };
          }
        })
      );

      // Modelled fallback from Open-Meteo
      const modelled = await fetchCurrentModelledAirQuality(lat, lng);
      if (modelled) {
        modelledFallback = {
          isModelled: true,
          provider: 'Open-Meteo Atmospheric Chemistry Model',
          disclaimer:
            'Modelled numerical estimate based on atmospheric dispersion simulations. Not an official regulatory ground station observation or CPCB AQI.',
          data: modelled,
        };
      }
    }

    res.json({
      success: true,
      city: {
        name: cityName,
        state: stateName || null,
        coordinates: { latitude: lat, longitude: lng },
        searchRadiusKm: radius,
      },
      overview: {
        totalNearbyStations: stationsData.length,
        stationsWithRecentData: stationsWithRecentData.length,
        validAqiStationsCount: validAqiStations.length,
        availablePollutants: uniquePollutants,
        aqiRange: aqiMin !== null && aqiMax !== null ? { min: aqiMin, max: aqiMax } : null,
      },
      stations: stationsData,
      noStationMessage,
      nearestAlternativeStations,
      modelledFallback,
    });
  } catch (error) {
    logger.error('getCityAirQuality error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve city air quality' });
  }
}

