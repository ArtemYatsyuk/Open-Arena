import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
  } as jwt.SignOptions);
}

export function generateRefreshToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  } as jwt.SignOptions);
}

/** Generate a cryptographically-random token for email verification / password reset. */
export function generateRandomToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

/** CSRF token generation & validation. */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function setAuthCookies(res: any, accessToken: string, refreshToken: string) {
  const secure = process.env.SECURE_COOKIES === 'true';
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: any) {
  const secure = process.env.SECURE_COOKIES === 'true';
  res.clearCookie('accessToken', { httpOnly: true, secure, sameSite: 'lax', path: '/' });
  res.clearCookie('refreshToken', { httpOnly: true, secure, sameSite: 'lax', path: '/' });
  res.clearCookie('csrfToken', { secure, sameSite: 'lax', path: '/' });
}
