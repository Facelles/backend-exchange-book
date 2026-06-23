import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import './models';
import authRoutes from './routes/authRoutes';
import bookRoutes from './routes/bookRoutes';
import meRoutes from './routes/meRoutes';
import adminRoutes from './routes/adminRoutes';
import profileRoutes from './routes/profileRoutes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/me', meRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
