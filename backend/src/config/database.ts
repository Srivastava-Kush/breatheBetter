import mongoose from 'mongoose';
import { env } from './environment';
import { logger } from '../utils/logger';

export let isDbConnected = false;

export async function connectDatabase(): Promise<boolean> {
  if (!env.mongodb.uri) {
    logger.warn('⚠️  No MONGODB_URI provided. Running in in-memory / fixture mock mode.');
    isDbConnected = false;
    return false;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.mongodb.uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 4000,
      socketTimeoutMS: 45000,
    });
    isDbConnected = true;
    logger.info('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    logger.warn('⚠️  MongoDB connection failed. Continuing in in-memory / fixture mode so app remains functional:');
    logger.warn(`   Reason: ${(error as Error).message}`);
    isDbConnected = false;
    return false;
  }
}

mongoose.connection.on('disconnected', () => {
  isDbConnected = false;
  logger.warn('⚠️  MongoDB disconnected. Attempting fallback...');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error:', err);
});
