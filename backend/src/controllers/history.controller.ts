import { Request, Response } from 'express';
import { getLocationHistory } from '../services/history.service';
import { logger } from '../utils/logger';

export async function getHistory(req: Request, res: Response): Promise<void> {
  try {
    const locationId = parseInt(req.params['locationId'] as string, 10);
    if (isNaN(locationId)) {
      res.status(400).json({ success: false, error: 'Invalid location ID' });
      return;
    }

    const hours = parseInt(req.query['hours'] as string || '168', 10);
    const pollutant = req.query['pollutant'] as string | undefined;

    const history = await getLocationHistory(locationId, { hours, pollutant });

    res.json({
      success: true,
      data: history,
      meta: {
        locationId,
        pollutant: pollutant ?? 'all',
        hours,
        count: history.length,
      },
    });
  } catch (error) {
    logger.error('getHistory error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve history' });
  }
}

export async function getPollutantHistory(req: Request, res: Response): Promise<void> {
  try {
    const locationId = parseInt(req.params['locationId'] as string, 10);
    const pollutant = req.params['pollutant'] as string;

    if (isNaN(locationId) || !pollutant) {
      res.status(400).json({ success: false, error: 'Invalid parameters' });
      return;
    }

    const hours = parseInt(req.query['hours'] as string || '168', 10);
    const history = await getLocationHistory(locationId, { hours, pollutant });

    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('getPollutantHistory error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve pollutant history' });
  }
}

