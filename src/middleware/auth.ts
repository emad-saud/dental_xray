import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/express';

export function attachUser(req: Request, res: Response, next: NextFunction): void {
  res.locals.currentUser = req.session.user;
  res.locals.notice = req.session.notice;
  res.locals.error = req.session.error;

  delete req.session.notice;
  delete req.session.error;

  next();
}

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.user) {
    req.session.error = 'Please login first.';
    res.redirect('/');
    return;
  }

  next();
}

export function ensureRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.user) {
      req.session.error = 'Please login first.';
      res.redirect('/');
      return;
    }

    if (!roles.includes(req.session.user.role)) {
      req.session.error = 'You do not have permission to open that page.';
      res.redirect('/dashboard');
      return;
    }

    next();
  };
}
