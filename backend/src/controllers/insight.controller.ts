import { Request, Response } from 'express';
import { getHealthRecommendation, getDominantPollutantDescription } from '../services/health.service';
import { getLatestAQI, getLatestPollutants } from '../services/aqi.service';
import { logger } from '../utils/logger';
import { AQICategory } from '../utils/aqi-calculator';

export async function getHealthInsights(req: Request, res: Response): Promise<void> {
  try {
    const locationId = parseInt(req.params['locationId'] as string, 10);
    if (isNaN(locationId)) {
      res.status(400).json({ success: false, error: 'Invalid location ID' });
      return;
    }

    const [aqi, pollutants] = await Promise.all([
      getLatestAQI(locationId),
      getLatestPollutants(locationId),
    ]);

    const category = (aqi?.isValid ? aqi.category : 'Unknown') as AQICategory | 'Unknown';
    const health = getHealthRecommendation(category);
    const dominantDesc = aqi?.dominantPollutant
      ? getDominantPollutantDescription(aqi.dominantPollutant)
      : null;

    res.json({
      success: true,
      data: {
        locationId,
        category,
        health,
        dominantPollutantDescription: dominantDesc,
        aqi: aqi?.isValid ? aqi.aqi : null,
        dominantPollutant: aqi?.dominantPollutant ?? null,
        pollutants,
        disclaimer:
          'Health recommendations are general information only. Consult a healthcare professional for personal health advice.',
      },
    });
  } catch (error) {
    logger.error('getHealthInsights error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve health insights' });
  }
}

