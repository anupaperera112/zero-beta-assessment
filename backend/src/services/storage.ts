import { OrderEvent, ErrorEvent } from '../types';

/**
 * In-memory storage implementation
 * In production, this would be replaced with DynamoDB, RDS, or another database
 * 
 * For idempotency, we use a composite key: partnerId + sequenceNumber
 */
class Storage {
  private orders: Map<string, OrderEvent> = new Map();
  private errors: ErrorEvent[] = [];

  // Idempotent insert - uses partnerId + sequenceNumber as key
  saveOrder(order: OrderEvent): void {
    const key = `${order.partnerId}-${order.sequenceNumber}`;
    // Only insert if not exists (idempotency)
    if (!this.orders.has(key)) {
      this.orders.set(key, order);
    }
  }

  getOrders(partnerId?: string, from?: Date, to?: Date): OrderEvent[] {
    let orders = Array.from(this.orders.values());

    if (partnerId) {
      orders = orders.filter(o => o.partnerId === partnerId);
    }

    if (from) {
      orders = orders.filter(o => new Date(o.eventTime) >= from);
    }

    if (to) {
      orders = orders.filter(o => new Date(o.eventTime) <= to);
    }

    // Sort by eventTime descending (most recent first)
    return orders.sort((a, b) => 
      new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime()
    );
  }

  getMonthlySummary(partnerId: string, month: number, year: number): {
    totalGross: number;
    totalDiscount: number;
    totalNet: number;
    orderCount: number;
  } {
    const orders = this.getOrders(partnerId);
    
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const monthlyOrders = orders.filter(order => {
      const orderDate = new Date(order.eventTime);
      return orderDate >= startDate && orderDate <= endDate;
    });

    const totalGross = monthlyOrders.reduce((sum, o) => sum + o.grossAmount, 0);
    const totalDiscount = monthlyOrders.reduce((sum, o) => sum + o.discount, 0);
    const totalNet = monthlyOrders.reduce((sum, o) => sum + o.netAmount, 0);
    const orderCount = monthlyOrders.length;

    return {
      totalGross: Math.round(totalGross * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
      orderCount
    };
  }

  saveError(error: ErrorEvent): void {
    this.errors.push(error);
  }

  getErrors(partnerId?: string, from?: Date, to?: Date): ErrorEvent[] {
    let errors = [...this.errors];

    if (partnerId) {
      errors = errors.filter(e => e.partnerId === partnerId);
    }

    if (from) {
      errors = errors.filter(e => new Date(e.receivedTime) >= from);
    }

    if (to) {
      errors = errors.filter(e => new Date(e.receivedTime) <= to);
    }

    // Sort by receivedTime descending
    return errors.sort((a, b) => 
      new Date(b.receivedTime).getTime() - new Date(a.receivedTime).getTime()
    );
  }

  // For testing
  clear(): void {
    this.orders.clear();
    this.errors = [];
  }
}

export const storage = new Storage();
