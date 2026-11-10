import { Router } from 'express';
import {
  getCurrentAQI,
  getDashboardData,
  refreshLocationData,
  getWeatherHandler,
} from '../controllers/aqi.controller';

const router = Router();

router.get('/weather/:locationId', getWeatherHandler);
router.get('/current/:locationId', getCurrentAQI);
router.get('/dashboard/:locationId', getDashboardData);
router.post('/refresh/:locationId', refreshLocationData);

export default router;

