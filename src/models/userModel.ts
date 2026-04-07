import { query } from '../config/db';
import { UserRole } from '../types/express';

export interface UserRecord {
  id: number;
  full_name: string;
  username: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

export async function getUserByUsername(username: string): Promise<UserRecord | null> {
  const result = await query<UserRecord>('SELECT * FROM users WHERE username = $1 LIMIT 1', [username]);
  return result.rows[0] || null;
}

export async function getUserById(id: number): Promise<UserRecord | null> {
  const result = await query<UserRecord>('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return result.rows[0] || null;
}

export async function getAllUsers(): Promise<UserRecord[]> {
  const result = await query<UserRecord>('SELECT * FROM users ORDER BY created_at DESC');
  return result.rows;
}

export async function countUsers(): Promise<number> {
  const result = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
  return Number(result.rows[0]?.count || 0);
}

export async function createUser(data: {
  fullName: string;
  username: string;
  passwordHash: string;
  role: UserRole;
}): Promise<void> {
  await query(
    `INSERT INTO users (full_name, username, password_hash, role)
     VALUES ($1, $2, $3, $4)`,
    [data.fullName, data.username, data.passwordHash, data.role]
  );
}
