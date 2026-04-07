import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: required('DATABASE_URL'),
  sessionSecret: required('SESSION_SECRET', 'super-secret-demo-key'),
  defaultAdminName: required('DEFAULT_ADMIN_NAME', 'System Admin'),
  defaultAdminUsername: required('DEFAULT_ADMIN_USERNAME', 'admin'),
  defaultAdminPassword: required('DEFAULT_ADMIN_PASSWORD', 'admin123')
};
