import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../index.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  generateRandomToken,
  setAuthCookies,
  clearAuthCookies,
} from '../services/authService.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { isAuthenticated, isNotBanned, AuthRequest } from '../middleware/auth.js';
import { getConfig } from '../config.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8),
  invitationToken: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/* ───── Register ───── */

router.post('/register', async (req, res) => {
  try {
    const { app } = getConfig();
    const parsed = registerSchema.parse(req.body);
    let { email, username, password, invitationToken } = parsed;

    // If registration is disabled, only allow invited users
    if (!app.allowRegistration) {
      if (!invitationToken) {
        return res.status(403).json({ error: 'Registration is disabled' });
      }
      const invitation = await prisma.invitation.findUnique({
        where: { token: invitationToken },
      });
      if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Invalid or expired invitation' });
      }
      // Pre-fill email from invitation if set
      if (invitation.email) {
        email = invitation.email;
      }
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) return res.status(409).json({ error: 'Email or username already exists' });

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
      },
      select: { id: true, email: true, username: true, role: true, avatarColor: true },
    });

    // Send verification email if SMTP is configured
    if (process.env.SMTP_HOST) {
      const vToken = generateRandomToken();
      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token: vToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      sendVerificationEmail(email, vToken).catch((e) =>
        console.error('[Auth] Failed to send verification email:', e),
      );
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);
    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json(user);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    console.error('[Auth] Register error:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/* ───── Login with account lockout ───── */

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMin = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return res
        .status(429)
        .json({ error: `Account locked. Try again in ${remainingMin} minute(s).` });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      const attempts = (user.loginAttempts ?? 0) + 1;
      const updates: any = { loginAttempts: attempts };
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        updates.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        updates.loginAttempts = 0;
      }
      await prisma.user.update({ where: { id: user.id }, data: updates });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset lockout on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null, lastActiveAt: new Date() },
    });

    if (user.isBanned) {
      return res.status(403).json({ error: 'Account banned', reason: user.banReason });
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);
    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatarColor: user.avatarColor,
      emailVerifiedAt: user.emailVerifiedAt,
    });
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    console.error('[Auth] Login error:', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

/* ───── Logout ───── */

router.post('/logout', (req, res) => {
  clearAuthCookies(res);
  res.json({ success: true });
});

/* ───── Refresh ───── */

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

/* ───── Me ───── */

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
        emailVerifiedAt: true,
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

/* ───── Verify email ───── */

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = z.object({ token: z.string().min(16) }).parse(req.body);

    const vt = await prisma.emailVerificationToken.findUnique({ where: { token } });
    if (!vt || vt.usedAt || vt.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: vt.userId }, data: { emailVerifiedAt: new Date() } }),
      prisma.emailVerificationToken.update({
        where: { id: vt.id },
        data: { usedAt: new Date() },
      }),
    ]);

    res.json({ success: true });
  } catch (e: any) {
    console.error('[Auth] Verify email error:', e);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/* ───── Request password reset ───── */

router.post('/request-reset', async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    // Don't reveal whether the email exists
    if (!user) {
      return res.json({ success: true });
    }

    // Invalidate old tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = generateRandomToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    sendPasswordResetEmail(email, token).catch((e) =>
      console.error('[Auth] Failed to send reset email:', e),
    );

    res.json({ success: true });
  } catch (e: any) {
    console.error('[Auth] Request reset error:', e);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

/* ───── Reset password ───── */

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = z
      .object({ token: z.string().min(16), newPassword: z.string().min(8) })
      .parse(req.body);

    const rt = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!rt || rt.usedAt || rt.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({ where: { id: rt.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: rt.id }, data: { usedAt: new Date() } }),
    ]);

    res.json({ success: true });
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    console.error('[Auth] Reset password error:', e);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
