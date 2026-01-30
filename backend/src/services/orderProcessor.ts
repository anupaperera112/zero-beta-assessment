import { OrderEvent } from '../types';
import { storage } from './storage';

/**
 * Order Processor - consumes valid orders from stream and persists them
 * Designed to be idempotent (safe to retry)
 */
export class OrderProcessor {
  start(): void {
    // Subscribe to valid_orders stream
    // In production, this would be a separate service/worker consuming from SQS/Kinesis
    // For now, we'll process synchronously when orders are published
  }

  processOrder(order: OrderEvent): void {
    // Idempotent save - uses partnerId + sequenceNumber as unique key
    // If the same order is reprocessed, it won't create duplicates
    storage.saveOrder(order);
  }
}

export const orderProcessor = new OrderProcessor();
