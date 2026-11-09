import { Router } from 'express';
import { getAlerts, createAlert, updateAlert, deleteAlert } from '../controllers/alert.controller';

const router = Router();

router.get('/', getAlerts);
router.post('/', createAlert);
router.put('/:id', updateAlert);
router.delete('/:id', deleteAlert);

export default router;

