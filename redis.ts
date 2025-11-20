import { Redis } from 'ioredis';
import { createLogger } from '../utils/logger';

const logger = createLogger('redis');

let redisConnection: Redis | null = null;

export const getRedisConnection = (): Redis => {
  if (!redisConnection) {
    redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    redisConnection.on('connect', () => {
      logger.info('✅ Redis connected');
    });

    redisConnection.on('error', (err) => {
      logger.error('❌ Redis error:', err);
    });
  }

  return redisConnection;
};

export default getRedisConnection;