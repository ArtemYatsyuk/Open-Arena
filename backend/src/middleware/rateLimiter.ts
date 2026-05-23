import rateLimit from 'express-rate-limit';

/**
 * Auth-specific rate limiter (login, register, refresh).
 * Tighter window — prevents brute-force attacks on credentials.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

/**
 * Global API rate limiter.
 * Applied to all routes under /api.
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Slow down.' },
});
