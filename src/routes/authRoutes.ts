import { Router } from 'express';
import { login, logout, showLogin } from '../controllers/authController';

const router = Router();

router.get('/', showLogin);
router.post('/login', login);
router.post('/logout', logout);

export default router;
