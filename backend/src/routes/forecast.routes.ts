import { Router } from 'express';
import { getLocationForecast } from '../controllers/forecast.controller';

const router = Router();

router.get('/:locationId', getLocationForecast);

export default router;

