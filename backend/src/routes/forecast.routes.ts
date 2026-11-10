import { Router } from 'express';
import { getLocationForecast, getMLPredictionHandler } from '../controllers/forecast.controller';

const router = Router();

router.get('/ml-prediction/:locationId', getMLPredictionHandler);
router.get('/:locationId', getLocationForecast);

export default router;

