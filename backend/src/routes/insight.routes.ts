import { Router } from 'express';
import { getHealthInsights } from '../controllers/insight.controller';

const router = Router();

router.get('/:locationId', getHealthInsights);

export default router;

