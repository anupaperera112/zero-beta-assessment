import { ErrorEvent } from '../types';
import { storage } from './storage';

/**
 * Error Processor - consumes invalid events from stream and stores them
 * Designed to be idempotent (safe to retry)
 * 
 * Idempotency Strategy:
 * 1. Client-provided idempotency key (Idempotency-Key header) - highest priority
 * 2. Content hash of payload - automatic fallback for duplicate detection
 * 3. Partner + receivedTime + payload hash - legacy support
 * 
 * If the same error event is reprocessed (retry), it will be detected as a duplicate
 * and the existing error will be returned without creating a new record.
 */
export class ErrorProcessor {
  start(): void {
    // Subscribe to error_orders stream
    // In production, this would be a separate service/worker
  }

  /**
   * Process an error with idempotency checks
   * Returns information about whether the error was saved or was a duplicate
   */
  processError(error: ErrorEvent): {
    saved: boolean;
    duplicate: boolean;
    existingError?: ErrorEvent;
    idempotencyMethod?: string;
  } {
    const result = storage.saveError(error);

    if (result.duplicate) {
      // Determine which method detected the duplicate
      let method = 'payload-hash';
      if (error.idempotencyKey) {
        method = 'idempotency-key';
      } else if (error.contentHash) {
        method = 'content-hash';
      }

      console.log(
        `[ErrorProcessor] Duplicate error detected for Partner ${error.partnerId} ` +
        `(method: ${method})`
      );

      return {
        saved: false,
        duplicate: true,
        existingError: result.existingError,
        idempotencyMethod: method
      };
    }

    // Log successful save
    const idempotencyInfo = error.idempotencyKey
      ? `idempotency-key: ${error.idempotencyKey}`
      : error.contentHash
        ? `content-hash: ${error.contentHash.substring(0, 8)}...`
        : 'payload-hash only';

    console.log(
      `[ErrorProcessor] Error saved for Partner ${error.partnerId} ` +
      `(${idempotencyInfo})`
    );

    return {
      saved: true,
      duplicate: false,
      idempotencyMethod: error.idempotencyKey ? 'idempotency-key' : error.contentHash ? 'content-hash' : 'payload-hash'
    };
  }
}

export const errorProcessor = new ErrorProcessor();
