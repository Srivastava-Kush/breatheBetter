import { Request, Response } from 'express';
import { getLatestPollutants, getLatestAQI } from '../services/aqi.service';
import { getLocationById } from '../services/location.service';
import { logger } from '../utils/logger';

export async function compareLocations(req: Request, res: Response): Promise<void> {
  try {
    const idsParam = req.query['ids'] as string;
    if (!idsParam) {
      res.status(400).json({ success: false, error: 'ids parameter required (comma-separated location IDs)' });
      return;
    }

    const locationIds = idsParam.split(',').map(Number).filter((n) => !isNaN(n));
    if (locationIds.length < 2 || locationIds.length > 5) {
      res.status(400).json({ success: false, error: 'Provide 2–5 location IDs for comparison' });
      return;
    }

    const comparisons = await Promise.all(
      locationIds.map(async (id) => {
        const [location, aqi, pollutants] = await Promise.all([
          getLocationById(id),
          getLatestAQI(id),
          getLatestPollutants(id),
        ]);

        if (!location) return null;

        return {
          locationId: id,
          stationName: location.name,
          locality: location.locality,
          country: location.country,
          coordinates: location.coordinates,
          aqi: aqi
            ? {
                value: aqi.isValid ? aqi.aqi : null,
                category: aqi.isValid ? aqi.category : null,
                dominantPollutant: aqi.isValid ? aqi.dominantPollutant : null,
                isValid: aqi.isValid,
                invalidReason: aqi.invalidReason,
                calculatedAt: aqi.calculatedAt,
              }
            : null,
          pollutants,
        };
      })
    );

    res.json({
      success: true,
      data: comparisons.filter(Boolean),
      note: 'Only compare values when units and pollutant types are compatible. No station averaging is performed.',
    });
  } catch (error) {
    logger.error('compareLocations error:', error);
    res.status(500).json({ success: false, error: 'Comparison failed' });
  }
}

