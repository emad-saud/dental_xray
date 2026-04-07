import { Router } from 'express';
import authRoutes from './authRoutes';
import adminRoutes from './adminRoutes';
import patientRoutes from './patientRoutes';
import { ensureAuthenticated } from '../middleware/auth';
import { showDashboard } from '../controllers/dashboardController';

const router = Router();

router.use(authRoutes);
router.get('/dashboard', ensureAuthenticated, showDashboard);
router.use('/admin', ensureAuthenticated, adminRoutes);
router.use('/patients', ensureAuthenticated, patientRoutes);

export default router;
