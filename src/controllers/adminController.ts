import { Request, Response } from 'express';
import { createUser, getAllUsers, getUserByUsername } from '../models/userModel';
import { hashPassword } from '../utils/password';
import { UserRole } from '../types/express';

const allowedRoles: UserRole[] = ['admin', 'xray_employee', 'dentist'];

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await getAllUsers();
  res.render('admin/users', { title: 'Manage Accounts', users, allowedRoles });
}

export async function createNewUser(req: Request, res: Response): Promise<void> {
  const { fullName, username, password, role } = req.body;

  if (!fullName || !username || !password || !role) {
    req.session.error = 'All account fields are required.';
    res.redirect('/admin/users');
    return;
  }

  if (!allowedRoles.includes(role as UserRole)) {
    req.session.error = 'Invalid role selected.';
    res.redirect('/admin/users');
    return;
  }

  const existing = await getUserByUsername(String(username).trim());
  if (existing) {
    req.session.error = 'That username is already taken.';
    res.redirect('/admin/users');
    return;
  }

  const passwordHash = await hashPassword(String(password));

  await createUser({
    fullName: String(fullName).trim(),
    username: String(username).trim(),
    passwordHash,
    role: role as UserRole
  });

  req.session.notice = 'Account created successfully.';
  res.redirect('/admin/users');
}
