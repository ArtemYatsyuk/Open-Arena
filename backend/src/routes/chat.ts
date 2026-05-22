import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { isAuthenticated, isNotBanned, AuthRequest } from '../middleware/auth.js';
import { streamChat, generateTitle } from '../services/chatService.js';
import { extractTextFromContent } from '../utils/contentParser.js';
import { searchWeb, getTodayDateString } from '../services/webSearchService.js';
import { runInlet, runOutlet } from '../services/filterEngine.js';
import { getConfig } from '../config.js';

const router = Router();

const chatSchema = z.object({
  conversationId: z.string().optional(),
  content: z.string().min(1).max(100000),
  modelId: z.string(),
  webSearch: z.boolean().optional(),
  reasoning: z.boolean().optional(),
  regenerateMessageId: z.string().optional(),
});

router.post('/', isAuthenticated, isNotBanned, async (req: AuthRequest, res) => {
  try {
    let { conversationId, content, modelId, webSearch, reasoning, regenerateMessageId } = chatSchema.parse(req.body);
    reasoning = reasoning !== false;

    // Filter inlet hook
    const inletBody = await runInlet({ messages: [{ role: 'user', content }], modelId, webSearch, reasoning }, req.userId!, req.userRole!);
    content = inletBody.messages?.[inletBody.messages.length - 1]?.content || content;
    modelId = inletBody.modelId || modelId;
    webSearch = inletBody.webSearch !== undefined ? inletBody.webSearch : webSearch;
    reasoning = inletBody.reasoning !== undefined ? inletBody.reasoning : reasoning;

    let convId = conversationId;
    let isNewConversation = false;
    let isRegenerate = !!regenerateMessageId;
    let targetMessage: any = null;
    let createdMessageId: string | null = null;
    let searchSources: { index: number; title: string; url: string; snippet: string }[] | null = null;

    if (isRegenerate) {
      targetMessage = await prisma.message.findUnique({ where: { id: regenerateMessageId } });
      if (!targetMessage || targetMessage.role !== 'assistant') {
        return res.status(400).json({ error: 'Invalid message to regenerate' });
      }
      convId = targetMessage.conversationId;
    }

    if (!convId) {
      const { app } = getConfig();
      if (app.maxConversationsPerUser > 0) {
        const convCount = await prisma.conversation.count({ where: { userId: req.userId! } });
        if (convCount >= app.maxConversationsPerUser) {
          return res.status(400).json({ error: `Maximum of ${app.maxConversationsPerUser} conversations reached` });
        }
      }
      const title = await generateTitle(content, modelId);
      const conv = await prisma.conversation.create({
        data: { userId: req.userId!, modelId, title },
      });
      convId = conv.id;
      isNewConversation = true;
    }

    if (!isRegenerate) {
      await prisma.message.create({
        data: { conversationId: convId, role: 'user', content },
      });
    }

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

    const onReasoning = reasoning ? (chunk: string) => {
      fullReasoning += chunk;
      res.write(`data: ${JSON.stringify({ type: 'reasoning', content: chunk })}\n\n`);
      if (typeof (res as any).flush === 'function') (res as any).flush();
    } : undefined;

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
      onReasoning,
    );

    const cleanedContent = extractTextFromContent(fullContent);

    if (isRegenerate && targetMessage) {
      // Store the old content as an alternative, update with new content
      let alternatives: { content: string; reasoning?: string }[] = [];
      try {
        alternatives = targetMessage.alternatives ? JSON.parse(targetMessage.alternatives) : [];
      } catch {}
      alternatives.push({ content: targetMessage.content, reasoning: targetMessage.reasoning || undefined });

      await prisma.message.update({
        where: { id: targetMessage.id },
        data: {
          content: cleanedContent,
          reasoning: reasoning ? (fullReasoning || null) : null,
          alternatives: JSON.stringify(alternatives),
          webSearchSources: searchSources ? JSON.stringify(searchSources) : null,
        },
      });

      res.write(`data: ${JSON.stringify({ type: 'alternative', messageId: targetMessage.id, content: cleanedContent, reasoning: reasoning ? fullReasoning : '', versionCount: alternatives.length + 1 })}\n\n`);
    } else {
      const newMsg = await prisma.message.create({
        data: {
          conversationId: convId,
          role: 'assistant',
          content: cleanedContent,
          reasoning: reasoning ? (fullReasoning || null) : null,
          webSearchSources: searchSources ? JSON.stringify(searchSources) : null,
        },
      });
      createdMessageId = newMsg.id;
    }

    await prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    // Filter outlet hook
    try {
      await runOutlet({ messages: [{ role: 'assistant', content: cleanedContent }] }, req.userId!, req.userRole!);
    } catch (e: any) {
      console.error('[Chat] Filter outlet error:', e.message);
    }

    if (isNewConversation) {
      const conv = await prisma.conversation.findUnique({ where: { id: convId } });
      res.write(`data: ${JSON.stringify({ type: 'conversation', id: convId, title: conv?.title })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: 'done', messageId: createdMessageId })}\n\n`);
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
