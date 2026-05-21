import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { isAuthenticated, isNotBanned, isAdmin, AuthRequest } from '../middleware/auth.js';
import { hashPassword } from '../services/authService.js';

const router = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
});

function getId(req: AuthRequest): string {
  return Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalUsers, activeToday, totalConversations, messagesToday] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastActiveAt: { gte: today } } }),
    prisma.conversation.count(),
    prisma.message.count({ where: { createdAt: { gte: today } } }),
  ]);

  const last30Days = await prisma.$queryRaw`
    SELECT DATE(createdAt) as date, COUNT(*) as count
    FROM Message
    WHERE createdAt >= date('now', '-30 days')
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
  `;

  const topUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      email: true,
      _count: { select: { conversations: true } },
    },
  });

  res.json({
    totalUsers,
    activeToday,
    totalConversations,
    messagesToday,
    last30Days,
    topUsers,
  });
});

router.get('/users', async (req: AuthRequest, res) => {
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
});

router.patch('/users/:id/ban', async (req: AuthRequest, res) => {
  const userId = getId(req);
  const { ban, reason } = req.body as { ban: boolean; reason?: string };
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isBanned: ban, banReason: ban ? reason || null : null },
    select: { id: true, isBanned: true, banReason: true },
  });
  res.json(updated);
});

router.patch('/users/:id/role', async (req: AuthRequest, res) => {
  const userId = getId(req);
  const { role } = req.body as { role: 'USER' | 'ADMIN' };
  if (!role || !['USER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, role: true },
  });
  res.json(updated);
});

router.delete('/users/:id', async (req: AuthRequest, res) => {
  const userId = getId(req);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.id === req.userId) return res.status(400).json({ error: 'Cannot delete yourself' });

  await prisma.user.delete({ where: { id: userId } });
  res.json({ success: true });
});

router.get('/users/:id/conversations', async (req: AuthRequest, res) => {
  const userId = getId(req);
  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
  res.json(conversations);
});

router.get('/conversations', async (req: AuthRequest, res) => {
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
});

export default router;
