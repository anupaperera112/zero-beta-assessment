import { Router, Request, Response } from 'express';
import { storage } from '../services/storage';

const router = Router();

/**
 * GET /api/errors
 * Fetch validation errors
 * Query params: partnerId (optional), from (ISO 8601), to (ISO 8601)
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const partnerId = req.query.partnerId as string | undefined;
    const fromStr = req.query.from as string | undefined;
    const toStr = req.query.to as string | undefined;

    const from = fromStr ? new Date(fromStr) : undefined;
    const to = toStr ? new Date(toStr) : undefined;

    if (fromStr && isNaN(from!.getTime())) {
      return res.status(400).json({ error: 'Invalid from date format. Use ISO 8601.' });
    }

    if (toStr && isNaN(to!.getTime())) {
      return res.status(400).json({ error: 'Invalid to date format. Use ISO 8601.' });
    }

    const errors = storage.getErrors(partnerId, from, to);
    res.json({ errors, count: errors.length });
  } catch (error) {
    console.error('Error fetching errors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
