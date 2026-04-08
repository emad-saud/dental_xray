import path from 'path';
import { Request, Response } from 'express';
import {
  addImageToPatient,
  createPatient,
  getImageById,
  getImagesByPatientId,
  getPatientById,
  getPatients
} from '../models/patientModel';
import { detectViewerKind, isInlineViewable, viewerKindLabel } from '../utils/fileTypes';
import { getOrthancViewerUrlForStudy, isOrthancEnabled, uploadDicomToOrthanc } from '../utils/orthanc';

export async function listPatients(req: Request, res: Response): Promise<void> {
  const searchTerm = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const patients = await getPatients(searchTerm);

  res.render('patients/index', {
    title: 'Patients',
    patients,
    searchTerm
  });
}

export function showCreatePatient(_req: Request, res: Response): void {
  res.render('patients/new', { title: 'New Patient' });
}

export async function storePatient(req: Request, res: Response): Promise<void> {
  const { patientId, fullName, gender, dob, phone, notes } = req.body;

  if (!patientId || !fullName) {
    req.session.error = 'Patient ID and patient name are required.';
    res.redirect('/patients/new');
    return;
  }

  try {
    const id = await createPatient({
      patientId: String(patientId).trim(),
      fullName: String(fullName).trim(),
      gender: gender ? String(gender) : '',
      dob: dob ? String(dob) : '',
      phone: phone ? String(phone) : '',
      notes: notes ? String(notes) : '',
      createdBy: req.session.user!.id
    });

    req.session.notice = 'Patient created successfully. You can now upload images.';
    res.redirect(`/patients/${id}`);
  } catch (error: any) {
    if (error?.code === '23505') {
      req.session.error = 'That Patient ID already exists.';
      res.redirect('/patients/new');
      return;
    }

    throw error;
  }
}

export async function showPatientDetails(req: Request, res: Response): Promise<void> {
  const patientId = Number(req.params.id);
  const patient = await getPatientById(patientId);

  if (!patient) {
    req.session.error = 'Patient not found.';
    res.redirect('/patients');
    return;
  }

  const images = await getImagesByPatientId(patientId);

  res.render('patients/show', {
    title: patient.full_name,
    patient,
    images,
    viewerKindLabel,
    isInlineViewable,
    orthancEnabled: isOrthancEnabled(),
    getOrthancViewerUrlForStudy
  });
}

export async function uploadPatientImage(req: Request, res: Response): Promise<void> {
  const patientId = Number(req.params.id);
  const patient = await getPatientById(patientId);

  if (!patient) {
    req.session.error = 'Patient not found.';
    res.redirect('/patients');
    return;
  }

  if (!req.file) {
    req.session.error = 'Please choose a file to upload.';
    res.redirect(`/patients/${patientId}`);
    return;
  }

  const viewerKind = detectViewerKind({
    originalName: req.file.originalname,
    mimetype: req.file.mimetype
  });

  let orthancInstanceId: string | null = null;
  let orthancStudyId: string | null = null;
  let orthancStudyUid: string | null = null;
  let orthancSyncError: string | null = null;

  if (viewerKind === 'dicom' && isOrthancEnabled()) {
    const uploadResult = await uploadDicomToOrthanc(path.join(process.cwd(), 'uploads', req.file.filename));
    orthancInstanceId = uploadResult.orthancInstanceId;
    orthancStudyId = uploadResult.orthancStudyId;
    orthancStudyUid = uploadResult.studyInstanceUid;
    orthancSyncError = uploadResult.error;
  }

  await addImageToPatient({
    patientId,
    imagePath: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
    description: req.body.description ? String(req.body.description) : '',
    uploadedBy: req.session.user!.id,
    viewerKind,
    mimeType: req.file.mimetype,
    orthancInstanceId,
    orthancStudyId,
    orthancStudyUid,
    orthancSyncError
  });

  if (viewerKind === 'dicom') {
    if (orthancStudyUid) {
      req.session.notice = 'Raw DICOM uploaded successfully and synced to Orthanc/OHIF for high-quality web viewing.';
    } else if (isOrthancEnabled()) {
      req.session.error = `Raw DICOM uploaded locally, but Orthanc/OHIF sync failed: ${orthancSyncError || 'Unknown error.'}`;
    } else {
      req.session.notice = 'Raw DICOM uploaded successfully. Enable Orthanc/OHIF for reliable browser viewing.';
    }
  } else if (viewerKind === 'package') {
    req.session.notice = 'Archive uploaded. DICOMDIR archives are stored for download; for browser viewing upload a single DICOM (.dcm) or JPG.';
  } else {
    req.session.notice = 'X-ray file uploaded successfully.';
  }

  res.redirect(`/patients/${patientId}`);
}

export async function showImageViewer(req: Request, res: Response): Promise<void> {
  const patientId = Number(req.params.id);
  const imageId = Number(req.params.imageId);

  const patient = await getPatientById(patientId);
  const image = await getImageById(imageId);

  if (!patient || !image || image.patient_id !== patient.id) {
    req.session.error = 'Requested image was not found for that patient.';
    res.redirect('/patients');
    return;
  }

  res.render('patients/image-viewer', {
    title: `${patient.full_name} - ${image.original_name}`,
    patient,
    image,
    viewerKindLabel,
    isInlineViewable,
    orthancEnabled: isOrthancEnabled(),
    orthancViewerUrl: getOrthancViewerUrlForStudy(image.orthanc_study_uid)
  });
}
