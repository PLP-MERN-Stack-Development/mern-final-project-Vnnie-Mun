import { Router } from 'express';
import { query } from '../config/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // Check database connection
    const dbCheck = await query('SELECT NOW()');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'ok',
        database: dbCheck.rows.length > 0 ? 'ok' : 'error',
        redis: 'ok', // TODO: actual Redis check
        ml_service: 'ok' // TODO: actual ML service check
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;