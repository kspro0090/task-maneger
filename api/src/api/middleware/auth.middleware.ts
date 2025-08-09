import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type AuthUserRole = 'admin' | 'staff' | 'viewer';

export interface AuthPayload {
  id: string;
  role: AuthUserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

const getAuthHeaderToken = (req: Request): string | null => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getAuthHeaderToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }
    const secret = process.env.JWT_SECRET as string;
    const payload = jwt.verify(token, secret) as AuthPayload;
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: AuthUserRole | AuthUserRole[]) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};