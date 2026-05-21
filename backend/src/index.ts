import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { initConfigWatcher, getConfig } from './config.js';

import authRoutes from './routes/auth.js';
import modelRoutes from './routes/models.js';
import chatRoutes from './routes/chat.js';
import conversationRoutes from './routes/conversations.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const prisma = new PrismaClient();

const app = express();
const PORT = parseInt(process.env.PORT || '4000');
const isDev = process.env.NODE_ENV !== 'production';

// CORS - only needed in dev mode
if (isDev) {
  app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
}

app.use(express.json({ limit: '20mb' }));
app.use(cookieParser());

initConfigWatcher();

app.get('/api/health', (req, res) => {
  const { app: appConfig } = getConfig();
  res.json({ status: 'ok', app: appConfig.name });
});

app.use('/api/auth', authRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/admin', adminRoutes);

// Serve frontend static files in production
if (!isDev) {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, () => {
  console.log(`Open Arena running on http://localhost:${PORT}`);
  if (isDev) {
    console.log('Development mode - frontend runs on http://localhost:5173');
  } else {
    console.log('Production mode - frontend served on same port');
  }
});
