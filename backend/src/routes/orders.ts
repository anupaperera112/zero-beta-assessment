import { Router, Request, Response } from 'express';
import { storage } from '../services/storage';

const router = Router();

/**
 * GET /api/orders
 * Fetch orders between two times
 * Query params: partnerId, from (ISO 8601), to (ISO 8601)
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

    const orders = storage.getOrders(partnerId, from, to);
    res.json({ orders, count: orders.length });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/orders/summary/monthly
 * Fetch monthly sales summary
 * Query params: partnerId (required), month (MM-YYYY)
 */
router.get('/summary/monthly', (req: Request, res: Response) => {
  try {
    const partnerId = req.query.partnerId as string | undefined;
    const monthStr = req.query.month as string | undefined;

    if (!partnerId) {
      return res.status(400).json({ error: 'partnerId is required' });
    }

    if (!monthStr) {
      return res.status(400).json({ error: 'month is required (format: MM-YYYY)' });
    }

    // Parse MM-YYYY
    const [month, year] = monthStr.split('-').map(Number);
    if (!month || !year || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid month format. Use MM-YYYY' });
    }

    const summary = storage.getMonthlySummary(partnerId, month, year);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching monthly summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
