import { Router } from 'express';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../index.js';
import { isAuthenticated, isNotBanned, isAdmin, AuthRequest } from '../middleware/auth.js';
import { hashPassword } from '../services/authService.js';
import { reloadConfig } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '../../../config.json');

const router = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
});

function getId(req: AuthRequest): string {
  return req.params.id as string;
}

function getQueryStr(req: AuthRequest, key: string): string {
  const val = req.query[key];
  if (Array.isArray(val)) return val[0] as string;
  if (typeof val === 'string') return val;
  return '';
}

function getQueryInt(req: AuthRequest, key: string, fallback: number): number {
  const val = parseInt(getQueryStr(req, key));
  return isNaN(val) ? fallback : val;
}

router.use(isAuthenticated, isNotBanned, isAdmin);

router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const period = getQueryStr(req, 'period') || '30d';
    if (!['7d', '30d', '1y'].includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Use 7d, 30d, or 1y' });
    }

    let dateRange: string;
    switch (period) {
      case '7d': dateRange = '-7 days'; break;
      case '1y': dateRange = '-1 year'; break;
      default: dateRange = '-30 days';
    }

    const [totalUsers, activeToday, totalConversations, messagesToday] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastActiveAt: { gte: today } } }),
      prisma.conversation.count(),
      prisma.message.count({ where: { createdAt: { gte: today } } }),
    ]);

    const days = period === '7d' ? 7 : period === '1y' ? 365 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const messages = await prisma.message.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const chartMap = new Map<string, number>();
    for (const m of messages) {
      const date = m.createdAt.toISOString().slice(0, 10);
      chartMap.set(date, (chartMap.get(date) || 0) + 1);
    }
    const chartData = Array.from(chartMap.entries()).map(([date, count]) => ({ date, count }));

    const topUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        lastActiveAt: true,
        _count: { select: { conversations: true } },
      },
    });

    res.json({
      totalUsers,
      activeToday,
      totalConversations,
      messagesToday,
      last30Days: chartData,
      topUsers,
    });
  } catch (e: any) {
    console.error('[Admin] Stats error:', e);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

router.get('/users', async (req: AuthRequest, res) => {
  try {
    const page = getQueryInt(req, 'page', 1);
    const limit = 50;
    const search = getQueryStr(req, 'search');
    const skip = (page - 1) * limit;

    const where: any = search
      ? {
          OR: [
            { username: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isBanned: true,
          banReason: true,
          createdAt: true,
          lastActiveAt: true,
          avatarColor: true,
          _count: { select: { conversations: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e: any) {
    console.error('[Admin] Users error:', e);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

router.post('/users', async (req: AuthRequest, res) => {
  try {
    const { email, username, password, role } = createUserSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) return res.status(409).json({ error: 'Email or username already exists' });

    const user = await prisma.user.create({
      data: { email, username, passwordHash: hashPassword(password), role },
      select: { id: true, email: true, username: true, role: true, avatarColor: true },
    });

    res.status(201).json(user);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.get('/users/:id', async (req: AuthRequest, res) => {
  try {
    const userId = getId(req);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isBanned: true,
        banReason: true,
        createdAt: true,
        lastActiveAt: true,
        avatarColor: true,
        _count: { select: { conversations: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const messageCount = await prisma.message.count({
      where: { conversation: { userId } },
    });

    res.json({ ...user, messageCount });
  } catch (e: any) {
    console.error('[Admin] User detail error:', e);
    res.status(500).json({ error: 'Failed to load user details' });
  }
});

const banSchema = z.object({
  ban: z.boolean(),
  reason: z.string().max(500).optional(),
});

const roleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

router.patch('/users/:id/ban', async (req: AuthRequest, res) => {
  try {
    const userId = getId(req);
    const { ban, reason } = banSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isBanned: ban, banReason: ban ? reason || null : null },
      select: { id: true, isBanned: true, banReason: true },
    });
    res.json(updated);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: 'Failed to update ban status' });
  }
});

router.patch('/users/:id/role', async (req: AuthRequest, res) => {
  try {
    const userId = getId(req);
    const { role } = roleSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, role: true },
    });
    res.json(updated);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: 'Failed to update role' });
  }
});

router.delete('/users/:id', async (req: AuthRequest, res) => {
  try {
    const userId = getId(req);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.id === req.userId) return res.status(400).json({ error: 'Cannot delete yourself' });

    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true });
  } catch (e: any) {
    console.error('[Admin] Delete user error:', e);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.get('/users/:id/conversations', async (req: AuthRequest, res) => {
  try {
    const userId = getId(req);
    const page = Math.max(1, parseInt(String(req.query.page || '1')));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'))));
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          messages: { orderBy: { createdAt: 'asc' } },
        },
      }),
      prisma.conversation.count({ where: { userId } }),
    ]);
    res.json({ conversations, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e: any) {
    console.error('[Admin] User conversations error:', e);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

router.get('/conversations', async (req: AuthRequest, res) => {
  try {
    const page = getQueryInt(req, 'page', 1);
    const limit = 50;
    const search = getQueryStr(req, 'search');
    const skip = (page - 1) * limit;

    const where: any = search
      ? {
          OR: [
            { title: { contains: search } },
            { user: { username: { contains: search } } },
          ],
        }
      : {};

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: { select: { username: true, email: true } },
          _count: { select: { messages: true } },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    res.json({ conversations, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e: any) {
    console.error('[Admin] Conversations error:', e);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

router.get('/conversations/:id/messages', async (req: AuthRequest, res) => {
  try {
    const convId = req.params.id as string;
    const conversation = await prisma.conversation.findUnique({ where: { id: convId } });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const messages = (await prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'asc' },
    })).map(m => ({
      ...m,
      webSearchSources: m.webSearchSources ? JSON.parse(m.webSearchSources) : null,
    }));
    res.json(messages);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to load messages: ' + e.message });
  }
});

router.get('/config', async (req, res) => {
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(raw);
    res.json(config);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to read config: ' + e.message });
  }
});

const writableConfigSchema = z.object({
  models: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    baseUrl: z.string().min(1),
    endpoint: z.string().min(1),
    modelId: z.string().min(1),
    apiKeyEnv: z.string().min(1),
    streaming: z.boolean(),
    contextWindow: z.number().int().positive(),
    description: z.string(),
  })),
  defaultModelId: z.string().min(1),
});

router.put('/config', async (req, res) => {
  try {
    const updates = writableConfigSchema.parse(req.body);

    const raw = fs.readFileSync(configPath, 'utf-8');
    const current = JSON.parse(raw);

    current.models = updates.models;
    current.defaultModelId = updates.defaultModelId;

    fs.writeFileSync(configPath, JSON.stringify(current, null, 2) + '\n', 'utf-8');

    reloadConfig();

    res.json({ success: true, message: 'Config saved. Models updated.' });
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: 'Failed to save config: ' + e.message });
  }
});

router.post('/config/backup', async (req, res) => {
  try {
    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(now.getMilliseconds()).padStart(3, '0')}`;
    const backupPath = configPath.replace('.json', `.backup.${ts}.json`);

    fs.copyFileSync(configPath, backupPath);
    const filename = path.basename(backupPath);

    res.json({ success: true, filename, message: `Config backed up as ${filename}` });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to backup config: ' + e.message });
  }
});

export default router;
