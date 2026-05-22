import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
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
}
