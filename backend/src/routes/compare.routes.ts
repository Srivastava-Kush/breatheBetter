import { Router } from 'express';
import { compareLocations } from '../controllers/comparison.controller';

const router = Router();

router.get('/', compareLocations);

export default router;

