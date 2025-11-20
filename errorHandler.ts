import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('error-handler');

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('Unhandled error:', err);
  
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
}