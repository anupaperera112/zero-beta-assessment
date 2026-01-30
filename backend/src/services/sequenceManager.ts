/**
 * Manages sequence numbers per partner
 * In production, this would use a distributed counter (e.g., DynamoDB atomic counter)
 */
class SequenceManager {
  private sequences: Map<string, number> = new Map();

  getNextSequence(partnerId: string): number {
    const current = this.sequences.get(partnerId) || 0;
    const next = current + 1;
    this.sequences.set(partnerId, next);
    return next;
  }

  reset(partnerId: string): void {
    this.sequences.set(partnerId, 0);
  }

  getCurrent(partnerId: string): number {
    return this.sequences.get(partnerId) || 0;
  }
}

export const sequenceManager = new SequenceManager();
