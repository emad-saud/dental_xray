CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  username VARCHAR(60) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'xray_employee', 'dentist')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  patient_id VARCHAR(60) UNIQUE NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  gender VARCHAR(20),
  dob DATE,
  phone VARCHAR(40),
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS xray_images (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  description TEXT,
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  viewer_kind VARCHAR(20) NOT NULL DEFAULT 'image',
  mime_type VARCHAR(120),
  orthanc_instance_id VARCHAR(80),
  orthanc_study_id VARCHAR(80),
  orthanc_study_uid VARCHAR(255),
  orthanc_sync_error TEXT
);

-- If you already created the database before patient_id was added, run:
-- ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_id VARCHAR(60);
-- UPDATE patients SET patient_id = CONCAT('P-', id) WHERE patient_id IS NULL OR BTRIM(patient_id) = '';
-- ALTER TABLE patients ALTER COLUMN patient_id SET NOT NULL;
-- CREATE UNIQUE INDEX IF NOT EXISTS patients_patient_id_unique_idx ON patients(patient_id);

-- If you already created the database before DICOM + Orthanc support was added, run:
-- ALTER TABLE xray_images ADD COLUMN IF NOT EXISTS viewer_kind VARCHAR(20) NOT NULL DEFAULT 'image';
-- ALTER TABLE xray_images ADD COLUMN IF NOT EXISTS mime_type VARCHAR(120);
-- ALTER TABLE xray_images ADD COLUMN IF NOT EXISTS orthanc_instance_id VARCHAR(80);
-- ALTER TABLE xray_images ADD COLUMN IF NOT EXISTS orthanc_study_id VARCHAR(80);
-- ALTER TABLE xray_images ADD COLUMN IF NOT EXISTS orthanc_study_uid VARCHAR(255);
-- ALTER TABLE xray_images ADD COLUMN IF NOT EXISTS orthanc_sync_error TEXT;
-- UPDATE xray_images SET viewer_kind = 'image' WHERE viewer_kind IS NULL OR BTRIM(viewer_kind) = '';
