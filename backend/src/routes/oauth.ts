import { Router } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../index.js';
import {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
} from '../services/authService.js';
import { isAuthenticated, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * OAuth provider configuration.
 * Add new providers by extending this map and providing the client config
 * via environment variables.
 */
const PROVIDERS: Record<
  string,
  {
    authorizeUrl: string;
    tokenUrl: string;
    userUrl: string;
    scope: string;
    clientId: () => string | undefined;
    clientSecret: () => string | undefined;
  }
> = {
  google: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'openid email profile',
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
  },
  github: {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userUrl: 'https://api.github.com/user',
    scope: 'read:user user:email',
    clientId: () => process.env.GITHUB_CLIENT_ID,
    clientSecret: () => process.env.GITHUB_CLIENT_SECRET,
  },
  discord: {
    authorizeUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    userUrl: 'https://discord.com/api/users/@me',
    scope: 'identify email',
    clientId: () => process.env.DISCORD_CLIENT_ID,
    clientSecret: () => process.env.DISCORD_CLIENT_SECRET,
  },
};

// In-memory store for OAuth state params (for CSRF). In production, use Redis.
const stateStore = new Map<string, { redirectUri: string; expiresAt: number }>();

function baseUrl(): string {
  return process.env.APP_URL || 'http://localhost:5173';
}

/* ───── Initiate OAuth flow ───── */

router.get('/:provider/login', (req, res) => {
  const provider = PROVIDERS[req.params.provider];
  if (!provider) return res.status(400).json({ error: 'Unsupported OAuth provider' });

  const clientId = provider.clientId();
  if (!clientId) return res.status(500).json({ error: 'OAuth client not configured' });

  const state = crypto.randomBytes(24).toString('hex');
  const redirectUri = `${baseUrl()}/api/oauth/${req.params.provider}/callback`;

  stateStore.set(state, { redirectUri, expiresAt: Date.now() + 10 * 60 * 1000 });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: provider.scope,
    state,
  });

  res.redirect(`${provider.authorizeUrl}?${params}`);
});

/* ───── OAuth callback ───── */

router.get('/:provider/callback', async (req, res) => {
  const provider = PROVIDERS[req.params.provider];
  if (!provider) return res.status(400).send('Unsupported provider');

  const { code, state } = req.query;

  // Validate state (CSRF)
  const stored = stateStore.get(state as string);
  if (!stored || stored.expiresAt < Date.now()) {
    return res.status(400).send('Invalid or expired state parameter');
  }
  stateStore.delete(state as string);

  const clientId = provider.clientId();
  const clientSecret = provider.clientSecret();
  if (!clientId || !clientSecret) return res.status(500).send('OAuth client not configured');

  // Exchange code for token
  const tokenParams = new URLSearchParams({
    code: code as string,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: stored.redirectUri,
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: tokenParams,
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error(`[OAuth] Token exchange failed:`, err);
    return res.status(500).send('OAuth token exchange failed');
  }

  const tokenData: any = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // Fetch user info
  const userRes = await fetch(provider.userUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userRes.ok) {
    return res.status(500).send('Failed to fetch user info');
  }

  const userData: any = await userRes.json();
  const providerAccountId = String(userData.id || userData.sub);
  const email: string = userData.email || '';
  const username: string = userData.name || userData.login || email.split('@')[0] || 'user';

  // Check for existing OAuth account link
  const existingLink = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider: req.params.provider, providerAccountId } },
    include: { user: true },
  });

  if (existingLink) {
    // Existing link — log in
    const user = existingLink.user;
    if (user.isBanned) {
      return res.status(403).send('Account banned');
    }
    const aToken = generateAccessToken(user.id, user.role);
    const rToken = generateRefreshToken(user.id, user.role);
    setAuthCookies(res, aToken, rToken);
    return res.redirect(`${baseUrl()}/`);
  }

  // Check if email matches an existing user
  let targetUser = email ? await prisma.user.findUnique({ where: { email } }) : null;

  if (!targetUser) {
    // Create new user
    targetUser = await prisma.user.create({
      data: {
        email: email || `${providerAccountId}@${req.params.provider}.oauth`,
        username: `${username}-${providerAccountId.slice(0, 6)}`,
        passwordHash: '',
        emailVerifiedAt: email ? new Date() : undefined,
      },
    });
  }

  // Create OAuth link
  await prisma.oAuthAccount.create({
    data: {
      userId: targetUser.id,
      provider: req.params.provider,
      providerAccountId,
    },
  });

  const aToken = generateAccessToken(targetUser.id, targetUser.role);
  const rToken = generateRefreshToken(targetUser.id, targetUser.role);
  setAuthCookies(res, aToken, rToken);

  res.redirect(`${baseUrl()}/`);
});

/* ───── List linked OAuth accounts for current user ───── */

router.get('/accounts', isAuthenticated, async (req: AuthRequest, res) => {
  const accounts = await prisma.oAuthAccount.findMany({
    where: { userId: req.userId! },
    select: { provider: true, createdAt: true },
  });
  res.json(accounts);
});

/* ───── Unlink OAuth account ───── */

router.delete('/:provider', isAuthenticated, async (req: AuthRequest, res) => {
  const prov = req.params.provider as string;
  await prisma.oAuthAccount.deleteMany({
    where: { userId: req.userId!, provider: prov },
  });
  res.json({ success: true });
});

export default router;
