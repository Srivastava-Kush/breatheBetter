import { Router } from 'express';
import { getAlerts, createAlert, updateAlert, deleteAlert } from '../controllers/alert.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// All smart alerts endpoints strictly require authentication
router.use(requireAuth);

router.get('/', getAlerts);
router.post('/', createAlert);
router.put('/:id', updateAlert);
router.delete('/:id', deleteAlert);

export default router;
