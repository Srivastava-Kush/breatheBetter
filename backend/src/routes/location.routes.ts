import { Router } from 'express';
import {
  listLocations,
  getLocation,
  nearbyLocations,
  searchLocationsController,
  triggerLocationSync,
} from '../controllers/location.controller';

const router = Router();

router.get('/', listLocations);
router.get('/nearby', nearbyLocations);
router.get('/search', searchLocationsController);
router.post('/sync', triggerLocationSync);
router.get('/:locationId', getLocation);

export default router;

