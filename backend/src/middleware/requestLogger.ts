import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { httpRequestDurationSeconds } from '../metrics';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const id = req.header('x-request-id') || randomUUID();
  (req as any).correlationId = id;
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    logger.info({ correlationId: id, method: req.method, url: req.originalUrl, status: res.statusCode, durationMs }, 'request_completed');
    try {
      httpRequestDurationSeconds.labels(req.method, req.path).observe(durationMs / 1000);
    } catch (e) {
      // metrics are best-effort in tests/dev
    }
  });

  logger.info({ correlationId: id, method: req.method, url: req.originalUrl }, 'request_started');
  next();
}

export default requestLogger;
