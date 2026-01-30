import { ErrorEvent } from '../types';
import { storage } from './storage';

/**
 * Error Processor - consumes invalid events from stream and stores them
 */
export class ErrorProcessor {
  start(): void {
    // Subscribe to error_orders stream
    // In production, this would be a separate service/worker
  }

  processError(error: ErrorEvent): void {
    storage.saveError(error);
  }
}

export const errorProcessor = new ErrorProcessor();
