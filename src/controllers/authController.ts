import { Request, Response } from 'express';
import { getUserByUsername } from '../models/userModel';
import { verifyPassword } from '../utils/password';

export function showLogin(req: Request, res: Response): void {
  if (req.session.user) {
    res.redirect('/dashboard');
    return;
  }

  res.render('auth/login', { title: 'Login' });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;

  if (!username || !password) {
    req.session.error = 'Username and password are required.';
    res.redirect('/');
    return;
  }

  const user = await getUserByUsername(String(username).trim());

  if (!user) {
    req.session.error = 'Invalid login details.';
    res.redirect('/');
    return;
  }

  const isValid = await verifyPassword(String(password), user.password_hash);

  if (!isValid) {
    req.session.error = 'Invalid login details.';
    res.redirect('/');
    return;
  }

  req.session.user = {
    id: user.id,
    fullName: user.full_name,
    username: user.username,
    role: user.role
  };

  req.session.notice = `Welcome back, ${user.full_name}.`;
  res.redirect('/dashboard');
}

export function logout(req: Request, res: Response): void {
  req.session.destroy(() => {
    res.redirect('/');
  });
}
