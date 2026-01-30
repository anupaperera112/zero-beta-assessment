import { PartnerAEvent, PartnerBEvent, OrderEvent } from '../types';

export function transformPartnerA(
  event: PartnerAEvent,
  partnerId: string,
  sequenceNumber: number,
  receivedTime: string,
  idempotencyKey?: string,
  contentHash?: string
): OrderEvent {
  // Convert epoch milliseconds to ISO 8601 UTC
  const eventTime = new Date(event.transactionTimeMs).toISOString();
  const processedTime = new Date().toISOString();

  const grossAmount = event.amount;
  const discount = 0; // Partner A doesn't have discount
  const netAmount = grossAmount - discount;

  return {
    productCode: event.skuId,
    eventTime,
    grossAmount,
    discount,
    netAmount,
    partnerId,
    sequenceNumber,
    receivedTime,
    streamOffset: 0, // In-memory implementation
    processedTime,
    idempotencyKey,
    contentHash
  };
}

export function transformPartnerB(
  event: PartnerBEvent,
  partnerId: string,
  sequenceNumber: number,
  receivedTime: string,
  idempotencyKey?: string,
  contentHash?: string
): OrderEvent {
  // Convert YYYY-MM-DD HH:mm:ss to ISO 8601 UTC
  // Assume the timestamp is in UTC (or adjust as needed)
  const [datePart, timePart] = event.purchaseTime.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  const eventTime = new Date(Date.UTC(year, month - 1, day, hour, minute, second)).toISOString();
  const processedTime = new Date().toISOString();

  const grossAmount = event.total;
  const discount = event.discount || 0;
  const netAmount = grossAmount - discount;

  return {
    productCode: event.itemCode,
    eventTime,
    grossAmount,
    discount,
    netAmount,
    partnerId,
    sequenceNumber,
    receivedTime,
    streamOffset: 0,
    processedTime,
    idempotencyKey,
    contentHash
  };
}
