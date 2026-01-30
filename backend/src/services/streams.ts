import { OrderEvent, ErrorEvent } from '../types';

/**
 * In-memory implementation of streams/queues
 * In AWS, these would be replaced with SQS, EventBridge, Kinesis, or MSK
 */
class Stream<T> {
  private queue: T[] = [];
  private subscribers: ((event: T) => void | Promise<void>)[] = [];

  publish(event: T): void {
    this.queue.push(event);
    // Notify subscribers
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(event);
      } catch (error) {
        console.error('Error in stream subscriber:', error);
      }
    });
  }

  subscribe(callback: (event: T) => void | Promise<void>): void {
    this.subscribers.push(callback);
  }

  // For testing/debugging
  getQueue(): T[] {
    return [...this.queue];
  }

  clear(): void {
    this.queue = [];
  }
}

export const validOrdersStream = new Stream<OrderEvent>();
export const errorOrdersStream = new Stream<ErrorEvent>();
