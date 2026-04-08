import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function toBoolean(value: string | undefined, fallback = false): boolean {
  if (typeof value === 'undefined') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export const env = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: required('DATABASE_URL'),
  sessionSecret: required('SESSION_SECRET', 'super-secret-demo-key'),
  defaultAdminName: required('DEFAULT_ADMIN_NAME', 'System Admin'),
  defaultAdminUsername: required('DEFAULT_ADMIN_USERNAME', 'admin'),
  defaultAdminPassword: required('DEFAULT_ADMIN_PASSWORD', 'admin123'),
  orthancEnabled: toBoolean(process.env.ORTHANC_ENABLED, false),
  orthancServerUrl: required('ORTHANC_SERVER_URL', 'http://127.0.0.1:8042'),
  orthancPublicUrl: required('ORTHANC_PUBLIC_URL', 'http://127.0.0.1:8042'),
  orthancUsername: process.env.ORTHANC_USERNAME || 'orthanc',
  orthancPassword: process.env.ORTHANC_PASSWORD || 'orthanc',
  orthancOhifPath: required('ORTHANC_OHIF_PATH', '/ohif/viewer')
};
