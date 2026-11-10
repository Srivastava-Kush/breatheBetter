import { Request, Response } from 'express';
import { getForecast } from '../services/forecast.service';
import { generateMLPrediction } from '../services/ml-prediction.service';
import { getLocationById } from '../services/location.service';
import { logger } from '../utils/logger';

export async function getLocationForecast(req: Request, res: Response): Promise<void> {
  try {
    const locationId = parseInt(req.params['locationId'] as string, 10);
    if (isNaN(locationId)) {
      res.status(400).json({ success: false, error: 'Invalid location ID' });
      return;
    }

    const location = await getLocationById(locationId);
    if (!location) {
      res.status(404).json({ success: false, error: 'Location not found' });
      return;
    }

    const days = Math.min(parseInt(req.query['days'] as string || '7', 10), 7);
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

    res.json({ success: true, data: forecast });
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

    const prediction = await generateMLPrediction(locationId);
    if (!prediction) {
      res.status(404).json({ success: false, error: 'Unable to generate ML prediction for this location' });
      return;
    }

    res.json({ success: true, data: prediction });
  } catch (error) {
    logger.error('getMLPredictionHandler error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate ML prediction' });
  }
}


