import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { isAuthenticated, isNotBanned, AuthRequest } from '../middleware/auth.js';
import { getConfig } from '../config.js';

const router = Router();

const createSchema = z.object({
  title: z.string().min(1).max(200),
  modelId: z.string(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  isStarred: z.boolean().optional(),
});

function getId(req: AuthRequest): string {
  return req.params.id as string;
}

router.get('/', isAuthenticated, isNotBanned, async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1')));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'))));
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: { userId: req.userId! },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          modelId: true,
          isStarred: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { messages: true } },
        },
      }),
      prisma.conversation.count({ where: { userId: req.userId! } }),
    ]);
    res.json({ conversations, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e: any) {
    console.error('[Conversations] List error:', e);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

router.post('/', isAuthenticated, isNotBanned, async (req: AuthRequest, res) => {
  try {
    const { title, modelId } = createSchema.parse(req.body);
    const { app } = getConfig();
    if (app.maxConversationsPerUser > 0) {
      const convCount = await prisma.conversation.count({ where: { userId: req.userId! } });
      if (convCount >= app.maxConversationsPerUser) {
        return res
          .status(400)
          .json({ error: `Maximum of ${app.maxConversationsPerUser} conversations reached` });
      }
    }
    const conversation = await prisma.conversation.create({
      data: { userId: req.userId!, modelId, title },
    });
    res.status(201).json(conversation);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.get('/:id', isAuthenticated, isNotBanned, async (req: AuthRequest, res) => {
  try {
    const id = getId(req);
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: req.userId! },
      select: {
        id: true,
        title: true,
        modelId: true,
        isStarred: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conversation);
  } catch (e: any) {
    console.error('[Conversations] Get error:', e);
    res.status(500).json({ error: 'Failed to load conversation' });
  }
});

router.put('/:id', isAuthenticated, isNotBanned, async (req: AuthRequest, res) => {
  try {
    const id = getId(req);
    const { title, isStarred } = updateSchema.parse(req.body);
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: req.userId! },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const updated = await prisma.conversation.update({
      where: { id },
      data: { ...(title && { title }), ...(isStarred !== undefined && { isStarred }) },
    });
    res.json(updated);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

router.delete('/:id', isAuthenticated, isNotBanned, async (req: AuthRequest, res) => {
  try {
    const id = getId(req);
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: req.userId! },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    await prisma.conversation.delete({ where: { id } });
    res.json({ success: true });
  } catch (e: any) {
    console.error('[Conversations] Delete error:', e);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

router.get('/:id/messages', isAuthenticated, isNotBanned, async (req: AuthRequest, res) => {
  try {
    const id = getId(req);
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: req.userId! },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const messages = (
      await prisma.message.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: 'asc' },
      })
    ).map((m) => ({
      ...m,
      webSearchSources: m.webSearchSources ? JSON.parse(m.webSearchSources) : null,
    }));
    res.json(messages);
  } catch (e: any) {
    console.error('[Conversations] Messages error:', e);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

export default router;
