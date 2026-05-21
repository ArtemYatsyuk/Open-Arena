import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { isAuthenticated, isNotBanned, AuthRequest } from '../middleware/auth.js';
import { streamChat, generateTitle } from '../services/chatService.js';
import { extractTextFromContent } from '../utils/contentParser.js';
import { searchWeb, getTodayDateString } from '../services/webSearchService.js';

const router = Router();

const chatSchema = z.object({
  conversationId: z.string().optional(),
  content: z.string().min(1),
  modelId: z.string(),
  webSearch: z.boolean().optional(),
});

router.post('/', isAuthenticated, isNotBanned, async (req: AuthRequest, res) => {
  try {
    const { conversationId, content, modelId, webSearch } = chatSchema.parse(req.body);

    let convId = conversationId;
    let isNewConversation = false;
    let searchSources: { index: number; title: string; url: string; snippet: string }[] | null = null;

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

    const formattedMessages = messages.map(m => ({ role: m.role, content: extractTextFromContent(m.content) }));

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    if (webSearch) {
      const today = getTodayDateString();
      const searchResults = await searchWeb(content);
      searchSources = searchResults.sources?.length ? searchResults.sources : null;
      const context = searchResults.text
        ? `Today is ${today}.\n\nLive web search results for the user's query are below. These are NOT part of your training data — use them to answer.\n\n${searchResults.text}`
        : `Today is ${today}. Web search was attempted but no results were retrieved. Answer using your best available knowledge, but take note of the current date.`;
      formattedMessages.unshift({ role: 'system', content: context });
      res.write(`data: ${JSON.stringify({ type: 'websearch', count: searchResults.count, sources: searchSources })}\n\n`);
      if (typeof (res as any).flush === 'function') (res as any).flush();
    }

    const controller = new AbortController();
    req.on('close', () => controller.abort());

    let fullContent = '';
    let fullReasoning = '';

    fullContent = await streamChat(
      modelId,
      formattedMessages,
      (chunk) => {
        fullContent += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        if (typeof (res as any).flush === 'function') (res as any).flush();
      },
      () => {},
      controller.signal,
      (chunk) => {
        fullReasoning += chunk;
        res.write(`data: ${JSON.stringify({ type: 'reasoning', content: chunk })}\n\n`);
        if (typeof (res as any).flush === 'function') (res as any).flush();
      },
    );

    const cleanedContent = extractTextFromContent(fullContent);
    await prisma.message.create({
      data: {
        conversationId: convId,
        role: 'assistant',
        content: cleanedContent,
        reasoning: fullReasoning || null,
        webSearchSources: searchSources ? JSON.stringify(searchSources) : null,
      },
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
