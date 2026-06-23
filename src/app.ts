import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import './models';
import authRoutes from './routes/authRoutes';
import bookRoutes from './routes/bookRoutes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/books', bookRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
