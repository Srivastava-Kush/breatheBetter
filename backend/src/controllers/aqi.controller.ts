import { Request, Response } from 'express';
import { getLatestAQI, getLatestPollutants, updateLatestReadings } from '../services/aqi.service';
import { getHealthRecommendation, getDominantPollutantDescription } from '../services/health.service';
import { getLocationById } from '../services/location.service';
import { logger } from '../utils/logger';
import { AQICategory } from '../utils/aqi-calculator';

export async function getCurrentAQI(req: Request, res: Response): Promise<void> {
  try {
    const locationId = parseInt(req.params['locationId'] as string, 10);
    if (isNaN(locationId)) {
      res.status(400).json({ success: false, error: 'Invalid location ID' });
      return;
    }

    const [aqiSnapshot, latestPollutants] = await Promise.all([
      getLatestAQI(locationId),
      getLatestPollutants(locationId),
    ]);

    res.json({
      success: true,
      data: {
        locationId,
        aqi: aqiSnapshot,
        pollutants: latestPollutants,
        calculatedAt: aqiSnapshot?.calculatedAt ?? null,
      },
    });
  } catch (error) {
    logger.error('getCurrentAQI error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve AQI' });
  }
}

export async function getDashboardData(req: Request, res: Response): Promise<void> {
  try {
    const locationId = parseInt(req.params['locationId'] as string, 10);
    if (isNaN(locationId)) {
      res.status(400).json({ success: false, error: 'Invalid location ID' });
      return;
    }

    const [location, aqiSnapshot, latestPollutants] = await Promise.all([
      getLocationById(locationId),
      getLatestAQI(locationId),
      getLatestPollutants(locationId),
    ]);

    if (!location) {
      res.status(404).json({ success: false, error: 'Location not found' });
      return;
    }

    const category = (aqiSnapshot?.isValid ? aqiSnapshot.category : 'Unknown') as AQICategory | 'Unknown';
    const healthRec = getHealthRecommendation(category);
    const dominantDesc = aqiSnapshot?.dominantPollutant
      ? getDominantPollutantDescription(aqiSnapshot.dominantPollutant)
      : null;

    res.json({
      success: true,
      data: {
        location: {
          id: location.openaqId,
          name: location.name,
          locality: location.locality,
          country: location.country,
          coordinates: location.coordinates,
          isMonitor: location.isMonitor,
          isMobile: location.isMobile,
          provider: location.provider,
        },
        aqi: aqiSnapshot
          ? {
              value: aqiSnapshot.isValid ? aqiSnapshot.aqi : null,
              category: aqiSnapshot.isValid ? aqiSnapshot.category : null,
              dominantPollutant: aqiSnapshot.isValid ? aqiSnapshot.dominantPollutant : null,
              subIndices: aqiSnapshot.subIndices,
              isValid: aqiSnapshot.isValid,
              invalidReason: aqiSnapshot.invalidReason,
              calculatedAt: aqiSnapshot.calculatedAt,
              displayLabel: aqiSnapshot.isValid
                ? 'BreatheBetter AQI — Calculated using CPCB methodology'
                : 'AQI unavailable — insufficient valid pollutant data',
            }
          : null,
        pollutants: latestPollutants,
        health: healthRec,
        dominantPollutantDescription: dominantDesc,
      },
    });
  } catch (error) {
    logger.error('getDashboardData error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve dashboard data' });
  }
}

export async function refreshLocationData(req: Request, res: Response): Promise<void> {
  try {
    const locationId = parseInt(req.params['locationId'] as string, 10);
    if (isNaN(locationId)) {
      res.status(400).json({ success: false, error: 'Invalid location ID' });
      return;
    }

    await updateLatestReadings(locationId);
    res.json({ success: true, message: 'Location data refreshed' });
  } catch (error) {
    logger.error('refreshLocationData error:', error);
    res.status(500).json({ success: false, error: 'Refresh failed' });
  }
}

