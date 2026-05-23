import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../index.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from '../services/authService.js';
import { isAuthenticated, isNotBanned, AuthRequest } from '../middleware/auth.js';
import { getConfig } from '../config.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req, res) => {
  try {
    const { app } = getConfig();
    if (!app.allowRegistration) {
      return res.status(403).json({ error: 'Registration is disabled' });
    }

    const { email, username, password } = registerSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) return res.status(409).json({ error: 'Email or username already exists' });

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash: hashPassword(password),
      },
      select: { id: true, email: true, username: true, role: true, avatarColor: true },
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);
    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json(user);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !comparePassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.isBanned) {
      return res.status(403).json({ error: 'Account banned', reason: user.banReason });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);
    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatarColor: user.avatarColor,
    });
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookies(res);
  res.json({ success: true });
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token' });

  try {
    const { userId, role } = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
      userId: string;
      role: string;
    };
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isBanned) return res.status(401).json({ error: 'User not found or banned' });

    const accessToken = generateAccessToken(userId, role);
    const refreshToken = generateRefreshToken(userId, role);
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ success: true });
  } catch {
    clearAuthCookies(res);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.get('/me', isAuthenticated, isNotBanned, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarColor: true,
        createdAt: true,
        isBanned: true,
        banReason: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e: any) {
    console.error('[Auth] Me error:', e);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;
