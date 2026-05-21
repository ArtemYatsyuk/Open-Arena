import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { initConfigWatcher, getConfig } from './config.js';

import authRoutes from './routes/auth.js';
import modelRoutes from './routes/models.js';
import chatRoutes from './routes/chat.js';
import conversationRoutes from './routes/conversations.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

export const prisma = new PrismaClient();

const app = express();
const PORT = parseInt(process.env.PORT || '4000');

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
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
  console.log(`Open Arena backend running on http://localhost:${PORT}`);
});
