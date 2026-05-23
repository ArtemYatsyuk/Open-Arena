import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { prisma } from '../index.js';
import { isAuthenticated, isNotBanned, AuthRequest } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.resolve(__dirname, '../../../data/uploads');
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
  'application/javascript',
  'text/javascript',
  'text/html',
  'text/css',
  'application/zip',
  'application/gzip',
  'application/x-tar',
];

await fs.mkdir(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${crypto.randomUUID()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

const router = Router();

router.post(
  '/',
  isAuthenticated,
  isNotBanned,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 20MB.' });
          }
          return res.status(400).json({ error: err.message });
        }
        if (err.message?.startsWith('Unsupported file type')) {
          return res.status(400).json({ error: err.message });
        }
        return res.status(500).json({ error: 'Upload failed' });
      }
      next();
    });
  },
  async (req: AuthRequest, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const conversationId = req.body.conversationId as string | undefined;
      if (!conversationId) {
        await fs.unlink(file.path);
        return res.status(400).json({ error: 'conversationId is required' });
      }

      const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (!conv || conv.userId !== req.userId!) {
        await fs.unlink(file.path);
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const attachment = await prisma.attachment.create({
        data: {
          conversationId,
          userId: req.userId!,
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.filename,
        },
      });

      res.status(201).json({
        id: attachment.id,
        conversationId: attachment.conversationId,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        size: attachment.size,
        url: `/api/attachments/${attachment.id}/file`,
        createdAt: attachment.createdAt.toISOString(),
      });
    } catch (e: any) {
      console.error('Upload error:', e);
      res.status(500).json({ error: 'Upload failed' });
    }
  },
);

router.get('/:id/file', isAuthenticated, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) {
      return res.status(404).json({ error: 'File not found' });
    }

    const conv = await prisma.conversation.findUnique({ where: { id: attachment.conversationId } });
    if (!conv || (conv.userId !== req.userId! && req.userRole !== 'ADMIN')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = path.join(UPLOAD_DIR, attachment.path);
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.setHeader('Content-Type', attachment.mimeType);
    const safeName = attachment.fileName.replace(/["\\\r\n]/g, '');
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    res.sendFile(filePath);
  } catch (e) {
    console.error('File download error:', e);
    res.status(500).json({ error: 'Download failed' });
  }
});

router.get('/conversation/:conversationId', isAuthenticated, async (req: AuthRequest, res) => {
  try {
    const conversationId = req.params.conversationId as string;
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv || conv.userId !== req.userId!) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const attachments = await prisma.attachment.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        size: true,
        messageId: true,
        createdAt: true,
      },
    });

    res.json({ attachments });
  } catch (e) {
    console.error('List attachments error:', e);
    res.status(500).json({ error: 'Failed to list attachments' });
  }
});

router.delete('/:id', isAuthenticated, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    if (attachment.userId !== req.userId! && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = path.join(UPLOAD_DIR, attachment.path);
    try {
      await fs.unlink(filePath);
    } catch {}

    await prisma.attachment.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    console.error('Delete attachment error:', e);
    res.status(500).json({ error: 'Delete failed' });
  }
});

export default router;
