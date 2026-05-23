import type { Request, Response, NextFunction } from 'express';
import { generateCsrfToken } from '../services/authService.js';

/**
 * Simple CSRF protection using a signed double-submit cookie pattern.
 *
 * On GET requests, if no csrfToken cookie exists, one is set.
 * On state-changing requests (POST, PUT, PATCH, DELETE), the
 * `X-CSRF-Token` header must match the csrfToken cookie value.
 *
 * SSE /api/chat is exempted because EventSource / fetch + streaming
 * doesn't support custom headers on the initial request.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Exempt SSE chat and auth routes (no CSRF token available before login)
  if (req.path === '/api/chat' || req.path.startsWith('/api/auth')) {
    return next();
  }

  const existingToken = req.cookies?.csrfToken;

  if (!existingToken) {
    const token = generateCsrfToken();
    const secure = process.env.SECURE_COOKIES === 'true';
    res.cookie('csrfToken', token, {
      secure,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  // Only check on state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.headers['x-csrf-token'] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
}
