import { Request, Response } from 'express';
import { getForecast } from '../services/forecast.service';
import { generateMLPrediction } from '../services/ml-prediction.service';
import { getLocationById } from '../services/location.service';
import { apiCache } from '../utils/cache';
import { logger } from '../utils/logger';

export async function getLocationForecast(req: Request, res: Response): Promise<void> {
  try {
    const locationId = parseInt(req.params['locationId'] as string, 10);
    if (isNaN(locationId)) {
      res.status(400).json({ success: false, error: 'Invalid location ID' });
      return;
    }

    const days = Math.min(parseInt(req.query['days'] as string || '7', 10), 7);
    const cacheKey = `forecast:${locationId}:${days}`;
    const cached = apiCache.get<any>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const location = await getLocationById(locationId);
    if (!location) {
      res.status(404).json({ success: false, error: 'Location not found' });
      return;
    }

    const forecast = await getForecast(
      locationId,
      location.coordinates.latitude,
      location.coordinates.longitude,
      days
    );

    if (!forecast) {
      res.json({
        success: true,
        data: null,
        message: 'Forecast unavailable. Open-Meteo integration may be disabled.',
      });
      return;
    }

    const payload = { success: true, data: forecast };
    apiCache.set(cacheKey, payload, 1800); // 30 min TTL
    res.json(payload);
  } catch (error) {
    logger.error('getLocationForecast error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve forecast' });
  }
}

export async function getMLPredictionHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = parseInt(req.params['locationId'] as string, 10);
    if (isNaN(locationId)) {
      res.status(400).json({ success: false, error: 'Invalid location ID' });
      return;
    }

    const cacheKey = `ml:${locationId}`;
    const cached = apiCache.get<any>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const prediction = await generateMLPrediction(locationId);
    if (!prediction) {
      res.status(404).json({ success: false, error: 'Unable to generate ML prediction for this location' });
      return;
    }

    const payload = { success: true, data: prediction };
    apiCache.set(cacheKey, payload, 1800);
    res.json(payload);
  } catch (error) {
    logger.error('getMLPredictionHandler error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate ML prediction' });
  }
}


