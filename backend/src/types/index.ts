// Partner A format
export interface PartnerAEvent {
  skuId: string;
  transactionTimeMs: number;
  amount: number;
}

// Partner B format
export interface PartnerBEvent {
  itemCode: string;
  purchaseTime: string; // YYYY-MM-DD HH:mm:ss
  total: number;
  discount?: number;
}

// Internal schema
export interface OrderEvent {
  productCode: string;
  eventTime: string; // ISO 8601 UTC
  grossAmount: number;
  discount: number;
  netAmount: number;
  partnerId: string; // 'A' or 'B'
  sequenceNumber: number;
  receivedTime: string; // ISO 8601 UTC
  streamOffset: number;
  processedTime: string; // ISO 8601 UTC
}

// Error event
export interface ErrorEvent {
  partnerId: string;
  rawPayload: unknown;
  receivedTime: string; // ISO 8601 UTC
  validationErrors: string[];
}

// Monthly summary response
export interface MonthlySummary {
  totalGross: number;
  totalDiscount: number;
  totalNet: number;
  orderCount: number;
}
