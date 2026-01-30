import { PartnerAEvent, PartnerBEvent, OrderEvent, ErrorEvent } from '../types';
import { validatePartnerA, validatePartnerB } from '../utils/validation';
import { transformPartnerA, transformPartnerB } from '../utils/transform';
import { sequenceManager } from './sequenceManager';
import { validOrdersStream, errorOrdersStream } from './streams';
import { orderProcessor } from './orderProcessor';
import { errorProcessor } from './errorProcessor';
import { generateContentHash, extractIdempotencyKey } from '../utils/idempotency';

export class FeedHandler {
  /**
   * Process an event from Partner A
   * @param payload - The order payload from Partner A
   * @param idempotencyKey - Optional idempotency key from request headers
   */
  handlePartnerA(
    payload: unknown,
    idempotencyKey?: string
  ): { success: boolean; message: string;} {
    const receivedTime = new Date().toISOString();
    const validation = validatePartnerA(payload);

    if (!validation.isValid) {
      const errorEvent: ErrorEvent = {
        partnerId: 'A',
        rawPayload: payload,
        receivedTime,
        validationErrors: validation.errors
      };

      errorOrdersStream.publish(errorEvent);
      return { success: false, message: 'Invalid payload. Error event queued.' };
    }

    const event = payload as PartnerAEvent;
    const sequenceNumber = sequenceManager.getNextSequence('A');

    // Generate content hash for duplicate detection (fallback if no idempotency key)
    const contentHash = generateContentHash(payload);

    const orderEvent = transformPartnerA(
      event,
      'A',
      sequenceNumber,
      receivedTime,
      idempotencyKey,
      contentHash
    );

    validOrdersStream.publish(orderEvent);
    return { success: true, message: 'Order event queued successfully.' };
  }

  /**
   * Process an event from Partner B
   * @param payload - The order payload from Partner B
   * @param idempotencyKey - Optional idempotency key from request headers
   */
  handlePartnerB(
    payload: unknown,
    idempotencyKey?: string
  ): { success: boolean; message: string;} {
    const receivedTime = new Date().toISOString();
    const validation = validatePartnerB(payload);

    if (!validation.isValid) {
      const errorEvent: ErrorEvent = {
        partnerId: 'B',
        rawPayload: payload,
        receivedTime,
        validationErrors: validation.errors
      };

      errorOrdersStream.publish(errorEvent);

      return { success: false, message: 'Invalid payload. Error event queued.' };
    }

    const event = payload as PartnerBEvent;
    const sequenceNumber = sequenceManager.getNextSequence('B');

    // Generate content hash for duplicate detection (fallback if no idempotency key)
    const contentHash = generateContentHash(payload);

    const orderEvent = transformPartnerB(
      event,
      'B',
      sequenceNumber,
      receivedTime,
      idempotencyKey,
      contentHash
    );

    validOrdersStream.publish(orderEvent);
    return { success: true, message: 'Order event queued successfully.' };
  }
}

export const feedHandler = new FeedHandler();
