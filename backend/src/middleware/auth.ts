import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

let lastActiveUpdates: Map<string, number> = new Map();

export function isAuthenticated(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { userId: string; role: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function isNotBanned(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(401).json({ error: 'User not found' });
  if (user.isBanned) return res.status(403).json({ error: 'Account banned', reason: user.banReason });

  const now = Date.now();
  const lastUpdate = lastActiveUpdates.get(req.userId) || 0;
  if (now - lastUpdate > 300000) {
    lastActiveUpdates.set(req.userId, now);
    await prisma.user.update({ where: { id: req.userId }, data: { lastActiveAt: new Date() } });
  }
  next();
}

export function isAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
  next();
}
