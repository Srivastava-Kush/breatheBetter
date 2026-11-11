import { Router } from 'express';
import { registerHandler, loginHandler, getMeHandler } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.get('/me', requireAuth, getMeHandler);

export default router;

