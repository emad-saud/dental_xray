import 'express-session';

export type UserRole = 'admin' | 'xray_employee' | 'dentist';

export interface SessionUser {
  id: number;
  fullName: string;
  username: string;
  role: UserRole;
}

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
    notice?: string;
    error?: string;
  }
}

declare global {
  namespace Express {
    interface Locals {
      currentUser?: SessionUser;
      notice?: string;
      error?: string;
    }
  }
}
