import { Router } from 'express';
import { getCurrentAQI, getDashboardData, refreshLocationData } from '../controllers/aqi.controller';

const router = Router();

router.get('/current/:locationId', getCurrentAQI);
router.get('/dashboard/:locationId', getDashboardData);
router.post('/refresh/:locationId', refreshLocationData);

export default router;

