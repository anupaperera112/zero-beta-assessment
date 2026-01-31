import { feedHandler } from '../feedHandler';
import { sequenceManager } from '../sequenceManager';
import { storage } from '../storage';

describe('FeedHandler', () => {
  beforeEach(() => {
    // Reset state
    sequenceManager.reset('A');
    sequenceManager.reset('B');
    storage.clear();
  });

  describe('Partner A', () => {
    it('should process a valid Partner A event', () => {
      const event = {
        skuId: 'SKU-1001',
        transactionTimeMs: 1733059200123,
        amount: 25.50
      };

      const result = feedHandler.handlePartnerA(event);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Order event queued successfully.');
    });

    it('should reject invalid Partner A event', () => {
      const event = {
        skuId: '',
        transactionTimeMs: 1733059200123,
        amount: 25.50
      };

      const result = feedHandler.handlePartnerA(event);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid payload. Error event queued.');
    });
  });

  describe('Partner B', () => {
    it('should process a valid Partner B event', () => {
      const event = {
        itemCode: 'IT-900',
        purchaseTime: '2026-01-28 10:12:30',
        total: 100.00,
        discount: 10.00
      };

      const result = feedHandler.handlePartnerB(event);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Order event queued successfully.');
    });

    it('should handle Partner B event without discount', () => {
      const event = {
        itemCode: 'IT-900',
        purchaseTime: '2026-01-28 10:12:30',
        total: 100.00
      };

      const result = feedHandler.handlePartnerB(event);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Order event queued successfully.');
    });
  });
});
