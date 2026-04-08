import { query } from '../config/db';
import { ViewerKind } from '../utils/fileTypes';

export interface PatientRecord {
  id: number;
  patient_id: string;
  full_name: string;
  gender: string | null;
  dob: string | null;
  phone: string | null;
  notes: string | null;
  created_by: number;
  created_at: Date;
  creator_name?: string;
}

export interface XrayImageRecord {
  id: number;
  patient_id: number;
  image_path: string;
  original_name: string;
  description: string | null;
  uploaded_by: number;
  uploaded_at: Date;
  uploader_name?: string;
  viewer_kind: ViewerKind;
  mime_type: string | null;
  orthanc_instance_id: string | null;
  orthanc_study_id: string | null;
  orthanc_study_uid: string | null;
  orthanc_sync_error: string | null;
}

export async function createPatient(data: {
  patientId: string;
  fullName: string;
  gender?: string;
  dob?: string;
  phone?: string;
  notes?: string;
  createdBy: number;
}): Promise<number> {
  const result = await query<{ id: number }>(
    `INSERT INTO patients (patient_id, full_name, gender, dob, phone, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      data.patientId,
      data.fullName,
      data.gender || null,
      data.dob || null,
      data.phone || null,
      data.notes || null,
      data.createdBy
    ]
  );

  return result.rows[0].id;
}

export async function getPatients(searchTerm = ''): Promise<PatientRecord[]> {
  const normalizedSearch = searchTerm.trim();

  if (!normalizedSearch) {
    const result = await query<PatientRecord>(
      `SELECT p.*, u.full_name AS creator_name
       FROM patients p
       JOIN users u ON u.id = p.created_by
       ORDER BY p.created_at DESC`
    );
    return result.rows;
  }

  const pattern = `%${normalizedSearch}%`;
  const result = await query<PatientRecord>(
    `SELECT p.*, u.full_name AS creator_name
     FROM patients p
     JOIN users u ON u.id = p.created_by
     WHERE p.patient_id ILIKE $1
        OR p.full_name ILIKE $1
        OR COALESCE(p.phone, '') ILIKE $1
     ORDER BY p.created_at DESC`,
    [pattern]
  );
  return result.rows;
}

export async function getPatientById(id: number): Promise<PatientRecord | null> {
  const result = await query<PatientRecord>(
    `SELECT p.*, u.full_name AS creator_name
     FROM patients p
     JOIN users u ON u.id = p.created_by
     WHERE p.id = $1
     LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getImagesByPatientId(patientId: number): Promise<XrayImageRecord[]> {
  const result = await query<XrayImageRecord>(
    `SELECT x.*, u.full_name AS uploader_name
     FROM xray_images x
     JOIN users u ON u.id = x.uploaded_by
     WHERE x.patient_id = $1
     ORDER BY x.uploaded_at DESC`,
    [patientId]
  );
  return result.rows;
}

export async function getImageById(imageId: number): Promise<XrayImageRecord | null> {
  const result = await query<XrayImageRecord>(
    `SELECT x.*, u.full_name AS uploader_name
     FROM xray_images x
     JOIN users u ON u.id = x.uploaded_by
     WHERE x.id = $1
     LIMIT 1`,
    [imageId]
  );

  return result.rows[0] || null;
}

export async function addImageToPatient(data: {
  patientId: number;
  imagePath: string;
  originalName: string;
  description?: string;
  uploadedBy: number;
  viewerKind: ViewerKind;
  mimeType?: string;
  orthancInstanceId?: string | null;
  orthancStudyId?: string | null;
  orthancStudyUid?: string | null;
  orthancSyncError?: string | null;
}): Promise<void> {
  await query(
    `INSERT INTO xray_images (
      patient_id,
      image_path,
      original_name,
      description,
      uploaded_by,
      viewer_kind,
      mime_type,
      orthanc_instance_id,
      orthanc_study_id,
      orthanc_study_uid,
      orthanc_sync_error
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      data.patientId,
      data.imagePath,
      data.originalName,
      data.description || null,
      data.uploadedBy,
      data.viewerKind,
      data.mimeType || null,
      data.orthancInstanceId || null,
      data.orthancStudyId || null,
      data.orthancStudyUid || null,
      data.orthancSyncError || null
    ]
  );
}

export async function countPatients(): Promise<number> {
  const result = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM patients');
  return Number(result.rows[0]?.count || 0);
}

export async function countImages(): Promise<number> {
  const result = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM xray_images');
  return Number(result.rows[0]?.count || 0);
}
