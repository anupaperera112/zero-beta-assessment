import { Router, Request, Response } from 'express';
import { feedHandler } from '../services/feedHandler';

const router = Router();

/**
 * POST /api/feed/partner-a
 * Accept order events from Partner A
 */
router.post('/partner-a', (req: Request, res: Response) => {
  try {
    const result = feedHandler.handlePartnerA(req.body);
    
    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: 'Order processed successfully',
        orderEvent: result.orderEvent
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errorEvent: result.errorEvent
      });
    }
  } catch (error) {
    console.error('Error processing Partner A event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/feed/partner-b
 * Accept order events from Partner B
 */
router.post('/partner-b', (req: Request, res: Response) => {
  try {
    const result = feedHandler.handlePartnerB(req.body);
    
    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: 'Order processed successfully',
        orderEvent: result.orderEvent
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errorEvent: result.errorEvent
      });
    }
  } catch (error) {
    console.error('Error processing Partner B event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
