import { Router } from 'express';
import {
  listPatients,
  showCreatePatient,
  showImageViewer,
  showPatientDetails,
  storePatient,
  uploadPatientImage
} from '../controllers/patientController';
import { ensureRole } from '../middleware/auth';
import { upload } from '../utils/uploader';

const router = Router();

router.get('/', ensureRole('admin', 'xray_employee', 'dentist'), listPatients);
router.get('/new', ensureRole('admin', 'xray_employee'), showCreatePatient);
router.post('/', ensureRole('admin', 'xray_employee'), storePatient);
router.get('/:id', ensureRole('admin', 'xray_employee', 'dentist'), showPatientDetails);
router.get('/:id/images/:imageId', ensureRole('admin', 'xray_employee', 'dentist'), showImageViewer);
router.post('/:id/images', ensureRole('admin', 'xray_employee'), upload.single('image'), uploadPatientImage);

export default router;
