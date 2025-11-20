import { Router } from 'express';
import { createLogger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();
const logger = createLogger('reports');

// All routes require authentication
router.use(authenticateToken);

// Get all reports with filters
router.get('/', async (req, res) => {
  try {
    const { crop, status, needsReview, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT * FROM reports WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (crop) {
      sql += ` AND predicted_disease LIKE $${paramIndex}`;
      params.push(`%${crop}%`);
      paramIndex++;
    }

    if (status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (needsReview === 'true') {
      sql += ` AND needs_human_review = true`;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await query(sql, params);

    // Get total count
    const countResult = await query('SELECT COUNT(*) FROM reports WHERE 1=1');

    res.json({
      reports: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

  } catch (error) {
    logger.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get single report
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM reports WHERE id = $1 OR report_uuid::text = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    logger.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Correct a report (human-in-loop)
router.post('/:id/correct', async (req, res) => {
  try {
    const { id } = req.params;
    const { correctedDisease, notes } = req.body;
    const userId = (req as any).user.id;

    const result = await query(
      `UPDATE reports 
       SET corrected_disease = $1, 
           correction_notes = $2, 
           reviewed_by = $3, 
           reviewed_at = NOW(),
           needs_human_review = false,
           updated_at = NOW()
       WHERE id = $4 OR report_uuid::text = $4
       RETURNING *`,
      [correctedDisease, notes, userId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    logger.info(`Report ${id} corrected by user ${userId}`);

    res.json(result.rows[0]);

  } catch (error) {
    logger.error('Error correcting report:', error);
    res.status(500).json({ error: 'Failed to correct report' });
  }
});

// Get statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(*) FILTER (WHERE needs_human_review = true) as needs_review,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d,
        COUNT(DISTINCT farmer_id_hash) as unique_farmers,
        AVG(confidence) as avg_confidence
      FROM reports
    `);

    res.json(stats.rows[0]);

  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;