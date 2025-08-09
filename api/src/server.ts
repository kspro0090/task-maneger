import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './api/routes/auth.routes';
import userRoutes from './api/routes/user.routes';
import taskRoutes from './api/routes/task.routes';
import { uploadsAbsolutePath, uploadsPublicPath } from './api/middleware/upload.middleware';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static serve uploads
app.use(uploadsPublicPath, express.static(uploadsAbsolutePath));

// Health check
app.get('/api/health', (_req, res) => res.status(200).json({ ok: true }));

// Routes under /api
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', taskRoutes);

// 404 handler
app.use((_req, res) => {
  return res.status(404).json({ error: 'Not found' });
});

// Central error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});