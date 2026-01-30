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
      expect(result.orderEvent).toBeDefined();
      expect(result.orderEvent?.partnerId).toBe('A');
      expect(result.orderEvent?.sequenceNumber).toBe(1);
      expect(result.orderEvent?.productCode).toBe('SKU-1001');
    });

    it('should increment sequence numbers', () => {
      const event1 = {
        skuId: 'SKU-1001',
        transactionTimeMs: 1733059200123,
        amount: 25.50
      };
      const event2 = {
        skuId: 'SKU-1002',
        transactionTimeMs: 1733059201000,
        amount: 30.00
      };

      feedHandler.handlePartnerA(event1);
      const result2 = feedHandler.handlePartnerA(event2);

      expect(result2.orderEvent?.sequenceNumber).toBe(2);
    });

    it('should reject invalid Partner A event', () => {
      const event = {
        skuId: '',
        transactionTimeMs: 1733059200123,
        amount: 25.50
      };

      const result = feedHandler.handlePartnerA(event);
      
      expect(result.success).toBe(false);
      expect(result.errorEvent).toBeDefined();
      expect(result.errorEvent?.partnerId).toBe('A');
      expect(result.errorEvent?.validationErrors.length).toBeGreaterThan(0);
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
      expect(result.orderEvent).toBeDefined();
      expect(result.orderEvent?.partnerId).toBe('B');
      expect(result.orderEvent?.sequenceNumber).toBe(1);
      expect(result.orderEvent?.productCode).toBe('IT-900');
      expect(result.orderEvent?.netAmount).toBe(90.00);
    });

    it('should handle Partner B event without discount', () => {
      const event = {
        itemCode: 'IT-900',
        purchaseTime: '2026-01-28 10:12:30',
        total: 100.00
      };

      const result = feedHandler.handlePartnerB(event);
      
      expect(result.success).toBe(true);
      expect(result.orderEvent?.discount).toBe(0);
      expect(result.orderEvent?.netAmount).toBe(100.00);
    });
  });
});
