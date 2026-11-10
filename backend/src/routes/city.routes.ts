import { Router } from 'express';
import { searchCitiesHandler, getCityAirQualityHandler } from '../controllers/city.controller';

const router = Router();

// GET /api/cities/search?q={query}&countryCode=IN
router.get('/search', searchCitiesHandler);

// GET /api/cities/air-quality?lat={lat}&lng={lng}&radius={km}&name={cityName}&state={stateName}
router.get('/air-quality', getCityAirQualityHandler);

export default router;

