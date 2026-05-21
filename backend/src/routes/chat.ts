import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { isAuthenticated, isNotBanned, AuthRequest } from '../middleware/auth.js';
import { streamChat, generateTitle } from '../services/chatService.js';

const router = Router();

const chatSchema = z.object({
  conversationId: z.string().optional(),
  content: z.string().min(1),
  modelId: z.string(),
});

router.post('/', isAuthenticated, isNotBanned, async (req: AuthRequest, res) => {
  try {
    const { conversationId, content, modelId } = chatSchema.parse(req.body);

    let convId = conversationId;
    let isNewConversation = false;

    if (!convId) {
      const title = await generateTitle(content, modelId);
      const conv = await prisma.conversation.create({
        data: { userId: req.userId!, modelId, title },
      });
      convId = conv.id;
      isNewConversation = true;
    }

    await prisma.message.create({
      data: { conversationId: convId, role: 'user', content },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'asc' },
      take: 40,
    });

    const formattedMessages = messages.map(m => ({ role: m.role, content: m.content }));

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const controller = new AbortController();
    req.on('close', () => controller.abort());

    let fullContent = '';

    fullContent = await streamChat(
      modelId,
      formattedMessages,
      (chunk) => {
        fullContent += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        if (typeof (res as any).flush === 'function') (res as any).flush();
      },
      () => {},
      controller.signal
    );

    await prisma.message.create({
      data: { conversationId: convId, role: 'assistant', content: fullContent },
    });

    await prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    if (isNewConversation) {
      const conv = await prisma.conversation.findUnique({ where: { id: convId } });
      res.write(`data: ${JSON.stringify({ type: 'conversation', id: convId, title: conv?.title })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    if (typeof (res as any).flush === 'function') (res as any).flush();
    res.end();
  } catch (e: any) {
    console.error('Chat error:', e);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message || 'Chat failed' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: e.message })}\n\n`);
      res.end();
    }
  }
});

export default router;
