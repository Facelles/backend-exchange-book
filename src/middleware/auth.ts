import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import type { UserRole } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

interface JwtPayload {
  id: number;
  role: UserRole;
}

const extractPayload = (req: Request): JwtPayload => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.split(' ')[1];
  if (!token) throw new Error('No token provided');

  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET not configured');

  return jwt.verify(token, secret) as JwtPayload;
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payload = extractPayload(req);

    const user = await User.findByPk(payload.id);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    const message =
      err instanceof jwt.JsonWebTokenError ? 'Invalid token' : 'Unauthorized';
    res.status(401).json({ message });
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ message: 'Forbidden: Admins only' });
    return;
  }
  next();
};

export const generateToken = (user: User): string => {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET not configured');

  const expiresIn = process.env['JWT_EXPIRES_IN'] ?? '7d';
  const payload: JwtPayload = { id: user.id, role: user.role };

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};
