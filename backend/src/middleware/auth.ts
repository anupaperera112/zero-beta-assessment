import { Request, Response, NextFunction } from 'express';
import { partnerService } from '../services/partnerService';

/**
 * Optional API key authentication middleware
 * 
 * Validates API keys if configured for the partner.
 * If no API key is configured for the partner, access is allowed.
 * 
 * API key can be provided via:
 * - Header: X-API-Key
 * - Query parameter: apiKey
 */
export const optionalApiKeyAuth = (req: Request, res: Response, next: NextFunction) => {

  const partnerId = (req.query && (req.query.partner as string)) || "";

  if (!partnerId) {
    return res.status(400).json({ error: 'Invalid partner endpoint' });
  }

  // Check if partner exists
  if (!partnerService.partnerExists(partnerId)) {
    return res.status(404).json({ error: `Partner ${partnerId} not found` });
  }

  // Extract API key from header or query parameter
  const apiKey = req.headers['x-api-key'] as string || req.query.apiKey as string;

  // Validate API key (returns true if partner has no API key configured)
  if (!partnerService.validateApiKey(partnerId, apiKey)) {
    return res.status(401).json({ 
      error: 'Invalid or missing API key',
      message: partnerService.requiresApiKey(partnerId) 
        ? 'API key is required for this partner' 
        : 'Invalid API key provided'
    });
  }

  // Attach partner ID to request for use in handlers
  (req as any).partnerId = partnerId;
  
  next();
};
