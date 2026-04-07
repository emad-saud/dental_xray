import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { detectViewerKind } from './fileTypes';

const uploadDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, uniqueName);
  }
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  const kind = detectViewerKind({
    originalName: file.originalname,
    mimetype: file.mimetype
  });

  if (kind === 'image' || kind === 'dicom' || kind === 'package' || kind === 'document') {
    cb(null, true);
    return;
  }

  cb(new Error('Only image files, DICOM files, or archives are allowed.'));
}

export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter
});
