import { Router, Request, Response } from 'express';
import { feedHandler } from '../services/feedHandler';
import { optionalApiKeyAuth } from '../middleware/auth';
import { extractIdempotencyKey } from '../utils/idempotency';

const router = Router();

/**
 * POST /api/feed/partner-a
 * Accept order events from Partner A
 * Optional API key authentication via X-API-Key header or apiKey query parameter
 * Optional idempotency key via Idempotency-Key or X-Idempotency-Key header for retry safety
 */
router.post('/partner-a', optionalApiKeyAuth, (req: Request, res: Response) => {
  try {
    // Extract idempotency key from headers
    const idempotencyKey = extractIdempotencyKey(req.headers);
    
    const result = feedHandler.handlePartnerA(req.body, idempotencyKey);
    
    if (result.success) {
      // If duplicate was detected, return 200 with existing order (idempotent)
      if (result.duplicate) {
        return res.status(200).json({ 
          success: true, 
          message: 'Order already processed (duplicate detected)',
          orderEvent: result.orderEvent,
          duplicate: true
        });
      }
      
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
 * Optional API key authentication via X-API-Key header or apiKey query parameter
 * Optional idempotency key via Idempotency-Key or X-Idempotency-Key header for retry safety
 */
router.post('/partner-b', optionalApiKeyAuth, (req: Request, res: Response) => {
  try {
    // Extract idempotency key from headers
    const idempotencyKey = extractIdempotencyKey(req.headers);
    
    const result = feedHandler.handlePartnerB(req.body, idempotencyKey);
    
    if (result.success) {
      // If duplicate was detected, return 200 with existing order (idempotent)
      if (result.duplicate) {
        return res.status(200).json({ 
          success: true, 
          message: 'Order already processed (duplicate detected)',
          orderEvent: result.orderEvent,
          duplicate: true
        });
      }
      
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
