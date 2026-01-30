import crypto from 'crypto';

/**
 * Generate a content hash from a payload for duplicate detection
 * This provides idempotency even if the client doesn't provide an idempotency key
 */
export function generateContentHash(payload: unknown): string {
  const payloadString = JSON.stringify(payload);
  return crypto.createHash('sha256').update(payloadString).digest('hex');
}

/**
 * Extract idempotency key from request headers
 * Clients can provide idempotency key via:
 * - Idempotency-Key header (standard)
 * - X-Idempotency-Key header (alternative)
 */
export function extractIdempotencyKey(headers: Record<string, string | string[] | undefined>): string | undefined {
  const idempotencyKey = headers['idempotency-key'] || headers['x-idempotency-key'];
  if (typeof idempotencyKey === 'string') {
    return idempotencyKey;
  }
  if (Array.isArray(idempotencyKey) && idempotencyKey.length > 0) {
    return idempotencyKey[0];
  }
  return undefined;
}
