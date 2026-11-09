import { Router } from 'express';
import { getHistory, getPollutantHistory } from '../controllers/history.controller';

const router = Router();

router.get('/:locationId', getHistory);
router.get('/:locationId/:pollutant', getPollutantHistory);

export default router;

