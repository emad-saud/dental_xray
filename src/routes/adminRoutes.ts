import { Router } from 'express';
import { createNewUser, listUsers } from '../controllers/adminController';
import { ensureRole } from '../middleware/auth';

const router = Router();

router.get('/users', ensureRole('admin'), listUsers);
router.post('/users', ensureRole('admin'), createNewUser);

export default router;
