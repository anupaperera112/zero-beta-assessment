import { PartnerAEvent, PartnerBEvent, OrderEvent, ErrorEvent } from '../types';
import { validatePartnerA, validatePartnerB } from '../utils/validation';
import { transformPartnerA, transformPartnerB } from '../utils/transform';
import { sequenceManager } from './sequenceManager';
import { validOrdersStream, errorOrdersStream } from './streams';
import { orderProcessor } from './orderProcessor';
import { errorProcessor } from './errorProcessor';

export class FeedHandler {
  /**
   * Process an event from Partner A
   */
  handlePartnerA(payload: unknown): { success: boolean; orderEvent?: OrderEvent; errorEvent?: ErrorEvent } {
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
      errorProcessor.processError(errorEvent);
      
      return { success: false, errorEvent };
    }

    const event = payload as PartnerAEvent;
    const sequenceNumber = sequenceManager.getNextSequence('A');
    const orderEvent = transformPartnerA(event, 'A', sequenceNumber, receivedTime);

    validOrdersStream.publish(orderEvent);
    orderProcessor.processOrder(orderEvent);

    return { success: true, orderEvent };
  }

  /**
   * Process an event from Partner B
   */
  handlePartnerB(payload: unknown): { success: boolean; orderEvent?: OrderEvent; errorEvent?: ErrorEvent } {
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
      errorProcessor.processError(errorEvent);
      
      return { success: false, errorEvent };
    }

    const event = payload as PartnerBEvent;
    const sequenceNumber = sequenceManager.getNextSequence('B');
    const orderEvent = transformPartnerB(event, 'B', sequenceNumber, receivedTime);

    validOrdersStream.publish(orderEvent);
    orderProcessor.processOrder(orderEvent);

    return { success: true, orderEvent };
  }
}

export const feedHandler = new FeedHandler();
