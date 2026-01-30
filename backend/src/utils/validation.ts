import { PartnerAEvent, PartnerBEvent } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePartnerA(payload: unknown): ValidationResult {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    return { isValid: false, errors: ['Payload must be an object'] };
  }

  const event = payload as Partial<PartnerAEvent>;

  // Check skuId
  if (!event.skuId) {
    errors.push('skuId is required');
  } else if (typeof event.skuId !== 'string' || event.skuId.trim() === '') {
    errors.push('skuId must be a non-empty string');
  }

  // Check transactionTimeMs
  if (event.transactionTimeMs === undefined || event.transactionTimeMs === null) {
    errors.push('transactionTimeMs is required');
  } else if (typeof event.transactionTimeMs !== 'number' || !Number.isInteger(event.transactionTimeMs) || event.transactionTimeMs <= 0) {
    errors.push('transactionTimeMs must be a positive integer (epoch milliseconds)');
  }

  // Check amount
  if (event.amount === undefined || event.amount === null) {
    errors.push('amount is required');
  } else if (typeof event.amount !== 'number' || isNaN(event.amount) || !isFinite(event.amount)) {
    errors.push('amount must be a valid number');
  } else if (event.amount < 0) {
    errors.push('amount must be non-negative');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validatePartnerB(payload: unknown): ValidationResult {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    return { isValid: false, errors: ['Payload must be an object'] };
  }

  const event = payload as Partial<PartnerBEvent>;

  // Check itemCode
  if (!event.itemCode) {
    errors.push('itemCode is required');
  } else if (typeof event.itemCode !== 'string' || event.itemCode.trim() === '') {
    errors.push('itemCode must be a non-empty string');
  }

  // Check purchaseTime
  if (!event.purchaseTime) {
    errors.push('purchaseTime is required');
  } else if (typeof event.purchaseTime !== 'string' || event.purchaseTime.trim() === '') {
    errors.push('purchaseTime must be a non-empty string');
  } else {
    // Validate format: YYYY-MM-DD HH:mm:ss
    const timestampRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!timestampRegex.test(event.purchaseTime)) {
      errors.push('purchaseTime must be in format YYYY-MM-DD HH:mm:ss');
    }
  }

  // Check total
  if (event.total === undefined || event.total === null) {
    errors.push('total is required');
  } else if (typeof event.total !== 'number' || isNaN(event.total) || !isFinite(event.total)) {
    errors.push('total must be a valid number');
  } else if (event.total < 0) {
    errors.push('total must be non-negative');
  }

  // Check discount (optional)
  if (event.discount !== undefined && event.discount !== null) {
    if (typeof event.discount !== 'number' || isNaN(event.discount) || !isFinite(event.discount)) {
      errors.push('discount must be a valid number');
    } else if (event.discount < 0) {
      errors.push('discount must be non-negative');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
