import path from 'path';

export type ViewerKind = 'image' | 'dicom' | 'package' | 'document';

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tif', '.tiff']);
const dicomExtensions = new Set(['.dcm', '.dicom']);
const packageExtensions = new Set(['.zip', '.rar', '.7z']);

export function detectViewerKind(file: {
  originalName?: string;
  mimetype?: string;
}): ViewerKind {
  const extension = path.extname(file.originalName || '').toLowerCase();
  const mimeType = String(file.mimetype || '').toLowerCase();
  const baseName = path.basename(file.originalName || '').toUpperCase();

  if (imageExtensions.has(extension) || mimeType.startsWith('image/')) {
    return 'image';
  }

  if (
    dicomExtensions.has(extension) ||
    baseName === 'DICOMDIR' ||
    mimeType === 'application/dicom' ||
    mimeType === 'application/dicom+json' ||
    mimeType === 'application/dicom+xml'
  ) {
    return baseName === 'DICOMDIR' ? 'package' : 'dicom';
  }

  if (packageExtensions.has(extension)) {
    return 'package';
  }

  return 'document';
}

export function isInlineViewable(kind: ViewerKind): boolean {
  return kind === 'image' || kind === 'dicom';
}

export function viewerKindLabel(kind: ViewerKind): string {
  switch (kind) {
    case 'image':
      return 'Standard image';
    case 'dicom':
      return 'DICOM image';
    case 'package':
      return 'Archive / DICOMDIR';
    default:
      return 'File attachment';
  }
}
