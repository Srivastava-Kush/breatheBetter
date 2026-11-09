import { Router } from 'express';
import { generateLocationInsights } from '../controllers/pollution-insight.controller';

const router = Router();

router.get('/:locationId', generateLocationInsights);

export default router;
