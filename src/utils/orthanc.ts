import fs from 'fs/promises';
import { env } from '../config/env';

export interface OrthancUploadResult {
  orthancInstanceId: string | null;
  orthancStudyId: string | null;
  studyInstanceUid: string | null;
  viewerUrl: string | null;
  error: string | null;
}

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json'
  };

  if (env.orthancUsername && env.orthancPassword) {
    headers.Authorization = `Basic ${Buffer.from(`${env.orthancUsername}:${env.orthancPassword}`).toString('base64')}`;
  }

  return headers;
}

export function isOrthancEnabled(): boolean {
  return env.orthancEnabled;
}

export function getOrthancViewerUrlForStudy(studyInstanceUid?: string | null): string | null {
  if (!env.orthancEnabled || !studyInstanceUid) {
    return null;
  }

  const publicUrl = trimTrailingSlashes(env.orthancPublicUrl);
  const ohifPath = env.orthancOhifPath.startsWith('/') ? env.orthancOhifPath : `/${env.orthancOhifPath}`;
  return `${publicUrl}${ohifPath}?StudyInstanceUIDs=${encodeURIComponent(studyInstanceUid)}`;
}

export async function uploadDicomToOrthanc(localFilePath: string): Promise<OrthancUploadResult> {
  if (!env.orthancEnabled) {
    return {
      orthancInstanceId: null,
      orthancStudyId: null,
      studyInstanceUid: null,
      viewerUrl: null,
      error: 'Orthanc integration is disabled.'
    };
  }

  const baseUrl = trimTrailingSlashes(env.orthancServerUrl);
  const headers = getAuthHeaders();

  try {
    const fileBuffer = await fs.readFile(localFilePath);
    const uploadResponse = await fetch(`${baseUrl}/instances`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/dicom'
      },
      body: fileBuffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      return {
        orthancInstanceId: null,
        orthancStudyId: null,
        studyInstanceUid: null,
        viewerUrl: null,
        error: `Orthanc upload failed (${uploadResponse.status}): ${errorText.slice(0, 300)}`
      };
    }

    const uploadJson = (await uploadResponse.json()) as Record<string, unknown>;
    const orthancInstanceId = String(uploadJson.ID || '');
    const orthancStudyId = String(uploadJson.ParentStudy || '');

    if (!orthancInstanceId || !orthancStudyId) {
      return {
        orthancInstanceId: orthancInstanceId || null,
        orthancStudyId: orthancStudyId || null,
        studyInstanceUid: null,
        viewerUrl: null,
        error: 'Orthanc accepted the file but did not return study details.'
      };
    }

    const studyResponse = await fetch(`${baseUrl}/studies/${orthancStudyId}`, {
      method: 'GET',
      headers
    });

    if (!studyResponse.ok) {
      const errorText = await studyResponse.text();
      return {
        orthancInstanceId,
        orthancStudyId,
        studyInstanceUid: null,
        viewerUrl: null,
        error: `Orthanc stored the file but the study lookup failed (${studyResponse.status}): ${errorText.slice(0, 300)}`
      };
    }

    const studyJson = (await studyResponse.json()) as Record<string, any>;
    const studyInstanceUid =
      studyJson?.MainDicomTags?.StudyInstanceUID ||
      studyJson?.MainDicomTags?.StudyInstanceUid ||
      null;

    if (!studyInstanceUid) {
      return {
        orthancInstanceId,
        orthancStudyId,
        studyInstanceUid: null,
        viewerUrl: null,
        error: 'Orthanc stored the file, but the StudyInstanceUID was missing.'
      };
    }

    return {
      orthancInstanceId,
      orthancStudyId,
      studyInstanceUid,
      viewerUrl: getOrthancViewerUrlForStudy(studyInstanceUid),
      error: null
    };
  } catch (error) {
    return {
      orthancInstanceId: null,
      orthancStudyId: null,
      studyInstanceUid: null,
      viewerUrl: null,
      error: error instanceof Error ? error.message : 'Unknown Orthanc upload error.'
    };
  }
}
