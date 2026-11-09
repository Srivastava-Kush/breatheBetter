import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { env } from './config/environment';
import { connectDatabase, isDbConnected } from './config/database';
import { logger } from './utils/logger';
import { errorHandler, notFound } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';

import locationRoutes from './routes/location.routes';
import aqiRoutes from './routes/aqi.routes';
import historyRoutes from './routes/history.routes';
import forecastRoutes from './routes/forecast.routes';
import compareRoutes from './routes/compare.routes';
import insightRoutes from './routes/insight.routes';
import alertRoutes from './routes/alert.routes';

import { startLocationSyncJob } from './jobs/locationSync.job';
import { startLatestReadingsJob } from './jobs/latestReadings.job';

async function bootstrap(): Promise<void> {
  // Database
  await connectDatabase();

  const app = express();

  // Security
  app.use(helmet());
  app.use(
    cors({
      origin: [env.client.url, 'http://localhost:5173'],
      credentials: true,
    })
  );

  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
  });

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging
  app.use(requestLogger);

  // Health check (no rate limit)
  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'BreatheBetter API',
    });
  });

  // API routes
  app.use('/api', apiLimiter);
  app.use('/api/locations', locationRoutes);
  app.use('/api/aqi', aqiRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/forecast', forecastRoutes);
  app.use('/api/compare', compareRoutes);
  app.use('/api/health-insights', insightRoutes);
  app.use('/api/alerts', alertRoutes);

  // Error handling
  app.use(notFound);
  app.use(errorHandler);

  // Start server
  app.listen(env.port, () => {
    logger.info(`🚀 BreatheBetter API running on port ${env.port} [${env.nodeEnv}]`);
    logger.info(`   Client URL: ${env.client.url}`);
  });

  // Start background jobs (only if DB is connected)
  if (env.nodeEnv !== 'test' && isDbConnected) {
    startLocationSyncJob();
    startLatestReadingsJob();
    logger.info('⏰ Background jobs started');
  } else {
    logger.info('ℹ️  Running in standalone fixture mode (background DB jobs paused)');
  }
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

