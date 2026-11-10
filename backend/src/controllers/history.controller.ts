import { Request, Response } from 'express';
import { getLocationHistory } from '../services/history.service';
import { detectPollutionAnomalies } from '../services/anomaly.service';
import { generatePollutionImpactReport } from '../services/report.service';
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

export async function getAnomaliesHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = parseInt(req.params['locationId'] as string, 10);
    if (isNaN(locationId)) {
      res.status(400).json({ success: false, error: 'Invalid location ID' });
      return;
    }

    const hours = parseInt(req.query['hours'] as string || '72', 10);
    const pollutant = (req.query['pollutant'] as string) || 'pm25';

    const report = await detectPollutionAnomalies(locationId, hours, pollutant);
    if (!report) {
      res.status(404).json({ success: false, error: 'Location not found' });
      return;
    }

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('getAnomaliesHandler error:', error);
    res.status(500).json({ success: false, error: 'Failed to detect anomalies' });
  }
}

export async function getReportHandler(req: Request, res: Response): Promise<void> {
  try {
    const locationId = parseInt(req.params['locationId'] as string, 10);
    if (isNaN(locationId)) {
      res.status(400).json({ success: false, error: 'Invalid location ID' });
      return;
    }

    const days = Math.min(parseInt(req.query['days'] as string || '30', 10), 90);
    const report = await generatePollutionImpactReport(locationId, days);
    if (!report) {
      res.status(404).json({ success: false, error: 'Location not found' });
      return;
    }

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('getReportHandler error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate impact report' });
  }
}


