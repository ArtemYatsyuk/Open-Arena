import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { isAuthenticated, isNotBanned, AuthRequest } from '../middleware/auth.js';

const router = Router();

const createSchema = z.object({
  title: z.string().min(1).max(200),
  modelId: z.string(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  isStarred: z.boolean().optional(),
});

router.get('/', isAuthenticated, isNotBanned, async (req: AuthRequest, res) => {
  const conversations = await prisma.conversation.findMany({
    where: { userId: req.userId! },
    orderBy: { updatedAt: 'desc' },
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
  res.json(conversations);
});

router.post('/', isAuthenticated, isNotBanned, async (req: AuthRequest, res) => {
  try {
    const { title, modelId } = createSchema.parse(req.body);
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
  const conversation = await prisma.conversation.findFirst({
    where: { id: req.params.id, userId: req.userId! },
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
});

router.put('/:id', isAuthenticated, isNotBanned, async (req: AuthRequest, res) => {
  try {
    const { title, isStarred } = updateSchema.parse(req.body);
    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const updated = await prisma.conversation.update({
      where: { id: req.params.id },
      data: { ...(title && { title }), ...(isStarred !== undefined && { isStarred }) },
    });
    res.json(updated);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

router.delete('/:id', isAuthenticated, isNotBanned, async (req: AuthRequest, res) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

  await prisma.conversation.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

router.get('/:id/messages', isAuthenticated, isNotBanned, async (req: AuthRequest, res) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

  const messages = await prisma.message.findMany({
    where: { conversationId: req.params.id },
    orderBy: { createdAt: 'asc' },
  });
  res.json(messages);
});

export default router;
