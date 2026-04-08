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
  - raw **DICOM** files such as **.dcm** and **.dicom**
  - stored **ZIP / DICOMDIR** packages for download
- Optional integration with **Orthanc + OHIF** for stronger DICOM web viewing

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

## DICOM strategy in this version

This build keeps your workflow focused on **raw DICOM**:

- the app stores the uploaded `.dcm` file **as raw `.dcm`**
- it does **not** convert the file to JPG or PNG
- if Orthanc/OHIF is enabled, the same raw DICOM is also sent to Orthanc for browser viewing
- if Orthanc/OHIF is not enabled, the raw DICOM still stays in `uploads/` and can be downloaded/opened directly

## Free tool or paid subscription?

You do **not** need a paid subscription for the core viewer stack used here:

- **Orthanc** is free and open-source medical imaging server software.
- **OHIF Viewer** is open-source, web-based, and free to use.
- Orthanc’s official OHIF plugin is available, and the `orthancteam/orthanc` Docker images include the plugin.

## Why this is more reliable than the old viewer

The older browser-only page tried to decode raw DICOM directly with a lightweight client-side loader. This version instead supports an Orthanc/OHIF path, which is much better suited for medical-image viewing. OHIF is designed as a web imaging platform and uses Cornerstone3D under the hood. Cornerstone3D documents support for many transfer syntaxes, including compressed formats such as JPEG 2000 and JPEG Lossless.

## Orthanc/OHIF quick start

This project includes `docker-compose.orthanc.yml` so you can start the free imaging stack quickly.

### 1. Start Orthanc + OHIF

```bash
docker compose -f docker-compose.orthanc.yml up -d
```

That starts Orthanc on:

- HTTP API / viewer host: `http://localhost:8042`
- DICOM port: `4242`
This compose file keeps Orthanc authentication off for easier local embedding in the app. Orthanc’s Docker images can enable plugins such as `DICOM_WEB_PLUGIN_ENABLED`, `OHIF_PLUGIN_ENABLED`, and `GDCM_PLUGIN_ENABLED` through environment variables.

### 2. Enable Orthanc in the app `.env`

```env
ORTHANC_ENABLED=true
ORTHANC_SERVER_URL=http://127.0.0.1:8042
ORTHANC_PUBLIC_URL=http://127.0.0.1:8042
ORTHANC_USERNAME=orthanc
ORTHANC_PASSWORD=orthanc
ORTHANC_OHIF_PATH=/ohif/viewer
```

### 3. Upload a raw `.dcm`

When an X-ray employee uploads a single DICOM file:

- the app saves it locally
- the app POSTs the raw file to Orthanc using `/instances`
- Orthanc returns the stored instance/study identifiers
- the app links the image record to the OHIF viewer for that study

Orthanc officially documents DICOM upload through `POST /instances`, and the response includes identifiers such as `ID` and `ParentStudy`.

### 4. Open the patient image

If the upload synced successfully, the image page will:

- show the raw DICOM as stored
- show an **Open in OHIF** button
- try to embed OHIF directly in the page
- keep a raw-file button as fallback

OHIF supports opening studies by `StudyInstanceUIDs` through URL parameters such as `/viewer?StudyInstanceUIDs=...`.

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
- Optional Orthanc/OHIF integration for DICOM viewing

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
docker-compose.orthanc.yml
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
ORTHANC_ENABLED=false
ORTHANC_SERVER_URL=http://127.0.0.1:8042
ORTHANC_PUBLIC_URL=http://127.0.0.1:8042
ORTHANC_USERNAME=orthanc
ORTHANC_PASSWORD=orthanc
ORTHANC_OHIF_PATH=/ohif/viewer
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

## Migration notes for existing databases

If you already created the database before this Orthanc update, run this once:

```sql
ALTER TABLE xray_images ADD COLUMN IF NOT EXISTS orthanc_instance_id VARCHAR(80);
ALTER TABLE xray_images ADD COLUMN IF NOT EXISTS orthanc_study_id VARCHAR(80);
ALTER TABLE xray_images ADD COLUMN IF NOT EXISTS orthanc_study_uid VARCHAR(255);
ALTER TABLE xray_images ADD COLUMN IF NOT EXISTS orthanc_sync_error TEXT;
```

## Notes

- Uploaded files are stored locally in the `uploads/` folder.
- Session storage is in-memory for simplicity. For production, use a persistent session store.
- This is a simple starter project designed to be easy to understand and extend.
- DICOMDIR packages are stored for download, not fully parsed as studies.
- Orthanc’s official OHIF plugin can use the DICOM JSON data source or DICOMweb, and DICOMweb support in Orthanc is provided by the official DICOMweb plugin.

## Install notes

If `npm install` hangs, your npm may still be using a private or unreachable registry. Run:

```bash
npm config delete registry
npm config set registry https://registry.npmjs.org/
npm install --registry=https://registry.npmjs.org/
```
