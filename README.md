# Dental X-Ray System

A simple dental clinic system built with **TypeScript**, **Node.js**, **Express**, **PostgreSQL**, and **EJS**.

## Features

- **Admin** account can create other accounts
- **X-ray employee** can create patients and upload X-ray files
- **Dentist** can view patients and all uploaded files
- Patient search by **Patient ID**, name, or phone
- Clean **MVC structure**
- Simple **white and blue** responsive design
- Automatic default admin creation on first run
- Support for:
  - regular images such as **JPG**, **JPEG**, **PNG**, **WEBP**, **TIFF**
  - single **DICOM** files such as **.dcm** and **.dicom**
  - stored **ZIP / DICOMDIR** packages for download

## Roles

### Admin
- Login
- View dashboard
- Create `admin`, `xray_employee`, or `dentist` accounts
- View patients and files

### X-ray Employee
- Login
- Create patients
- Upload X-ray files
- View patients and uploaded files

### Dentist
- Login
- Search patients quickly
- View patient data
- View X-ray files in the browser

## CS Imaging Note

CS Imaging can export images in ways that work well for the web app:

- Best for direct browser viewing: **JPG / JPEG**
- Best medical format for the browser viewer: **single DICOM file (.dcm)**
- If you export a **DICOMDIR** folder or a ZIP archive, the app stores it and lets staff download it, but direct browser rendering is not guaranteed because those packages often depend on many referenced files together.

## Default Admin

When the application starts for the first time and the database has no users, it automatically creates:

- **Username:** `admin`
- **Password:** `admin123`

You can change that in `.env`.

## Tech Stack

- Node.js
- Express
- TypeScript
- PostgreSQL
- EJS templates
- Multer for uploads
- express-session for basic authentication session handling
- Cornerstone viewer libraries loaded in the browser for DICOM viewing

## Project Structure

```text
src/
  config/
  controllers/
  middleware/
  models/
  routes/
  types/
  utils/
  views/
public/
  css/
uploads/
database/
```

## Setup

### 1. Install dependencies

```bash
npm install --registry=https://registry.npmjs.org/
```

### 2. Create PostgreSQL database

```sql
CREATE DATABASE dental_xray_db;
```

### 3. Copy environment file

```bash
cp .env.example .env
```

Update `DATABASE_URL` if needed.

Example:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dental_xray_db
SESSION_SECRET=my_secret_key
DEFAULT_ADMIN_NAME=System Admin
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
PORT=3000
```

### 4. Run the app

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

Open:

```text
http://localhost:3000
```

## Database

The app auto-creates tables on startup.

You can also run the SQL manually from:

```text
database/schema.sql
```

## Notes

- Uploaded files are stored locally in the `uploads/` folder.
- Session storage is in-memory for simplicity. For production, use a persistent session store.
- This is a simple starter project designed to be easy to understand and extend.
- DICOM viewing works for single files. DICOMDIR packages are stored for download, not fully parsed as studies.

## Install notes

If `npm install` hangs, your npm may still be using a private or unreachable registry. Run:

```bash
npm config delete registry
npm config set registry https://registry.npmjs.org/
npm install --registry=https://registry.npmjs.org/
```

## Patient ID

Each patient has a required `Patient ID` field entered manually by the X-ray employee. This is intended to match an external clinic or imaging system reference. The internal database still keeps its own numeric primary key for routing and relations.

If you already created the tables before this update, run this SQL once:

```sql
ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_id VARCHAR(60);
UPDATE patients SET patient_id = CONCAT('P-', id) WHERE patient_id IS NULL OR BTRIM(patient_id) = '';
ALTER TABLE patients ALTER COLUMN patient_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS patients_patient_id_unique_idx ON patients(patient_id);
```

If you already created the tables before the CS Imaging / DICOM update, also run:

```sql
ALTER TABLE xray_images ADD COLUMN IF NOT EXISTS viewer_kind VARCHAR(20) NOT NULL DEFAULT 'image';
ALTER TABLE xray_images ADD COLUMN IF NOT EXISTS mime_type VARCHAR(120);
UPDATE xray_images SET viewer_kind = 'image' WHERE viewer_kind IS NULL OR BTRIM(viewer_kind) = '';
```
