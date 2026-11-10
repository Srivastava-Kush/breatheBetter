import { Router } from 'express';
import {
  getHistory,
  getPollutantHistory,
  getAnomaliesHandler,
  getReportHandler,
} from '../controllers/history.controller';

const router = Router();

router.get('/anomalies/:locationId', getAnomaliesHandler);
router.get('/report/:locationId', getReportHandler);
router.get('/:locationId', getHistory);
router.get('/:locationId/:pollutant', getPollutantHistory);

export default router;

