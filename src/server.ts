import app from './app';
import { env } from './config/env';
import { query } from './config/db';
import { countUsers, createUser } from './models/userModel';
import { hashPassword } from './utils/password';

async function initializeDatabase(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(120) NOT NULL,
      username VARCHAR(60) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'xray_employee', 'dentist')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS patients (
      id SERIAL PRIMARY KEY,
      patient_id VARCHAR(60) UNIQUE,
      full_name VARCHAR(120) NOT NULL,
      gender VARCHAR(20),
      dob DATE,
      phone VARCHAR(40),
      notes TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS patient_id VARCHAR(60);
  `);

  await query(`
    UPDATE patients
    SET patient_id = CONCAT('P-', id)
    WHERE patient_id IS NULL OR BTRIM(patient_id) = '';
  `);

  await query(`
    ALTER TABLE patients
    ALTER COLUMN patient_id SET NOT NULL;
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS patients_patient_id_unique_idx
    ON patients(patient_id);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS xray_images (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      image_path TEXT NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      description TEXT,
      uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      viewer_kind VARCHAR(20) NOT NULL DEFAULT 'image',
      mime_type VARCHAR(120)
    );
  `);

  await query(`
    ALTER TABLE xray_images
    ADD COLUMN IF NOT EXISTS viewer_kind VARCHAR(20) NOT NULL DEFAULT 'image';
  `);

  await query(`
    ALTER TABLE xray_images
    ADD COLUMN IF NOT EXISTS mime_type VARCHAR(120);
  `);

  await query(`
    UPDATE xray_images
    SET viewer_kind = 'image'
    WHERE viewer_kind IS NULL OR BTRIM(viewer_kind) = '';
  `);

  await query(`
    ALTER TABLE xray_images
    ALTER COLUMN viewer_kind SET NOT NULL;
  `);
}

async function ensureDefaultAdmin(): Promise<void> {
  const totalUsers = await countUsers();

  if (totalUsers > 0) {
    return;
  }

  const passwordHash = await hashPassword(env.defaultAdminPassword);

  await createUser({
    fullName: env.defaultAdminName,
    username: env.defaultAdminUsername,
    passwordHash,
    role: 'admin'
  });

  console.log(`Default admin created: ${env.defaultAdminUsername}`);
}

async function bootstrap(): Promise<void> {
  await initializeDatabase();
  await ensureDefaultAdmin();

  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
