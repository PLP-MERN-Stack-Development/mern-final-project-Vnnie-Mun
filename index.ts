import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import webhookRouter from './routes/webhooks';
import reportsRouter from './routes/reports';
import authRouter from './routes/auth';

dotenv.config();

const app = express();
const logger = createLogger('server');
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Routes
app.use('/api/health', healthRouter);
app.use('/webhooks', webhookRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/auth', authRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 ML Service: ${process.env.ML_SERVICE_URL}`);
  logger.info(`💬 WhatsApp Mock: ${process.env.USE_MOCK_WHATSAPP === 'true' ? 'ENABLED' : 'DISABLED'}`);
});

export default app;