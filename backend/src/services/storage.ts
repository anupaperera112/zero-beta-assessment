import { OrderEvent, ErrorEvent } from "../types";
import { logger } from "../utils/logger";
import { eventsProcessed, errorsTotal } from "../metrics";

/**
 * In-memory storage implementation
 * In production, this would be replaced with DynamoDB, RDS, or another database
 *
 * For idempotency, we use multiple strategies:
 * 1. Idempotency key (if provided by client) - partnerId + idempotencyKey
 * 2. Content hash (fallback) - partnerId + contentHash
 * 3. Sequence number (legacy) - partnerId + sequenceNumber
 */
class Storage {
	private orders: Map<string, OrderEvent> = new Map();
	private errors: Map<string, ErrorEvent> = new Map();
	// Track idempotency keys and content hashes for duplicate detection
	private idempotencyKeys: Map<string, string> = new Map(); // idempotencyKey -> orderKey
	private contentHashes: Map<string, string> = new Map(); // contentHash -> orderKey
	// Track error idempotency keys and content hashes for duplicate detection
	private errorIdempotencyKeys: Map<string, string> = new Map(); // idempotencyKey -> errorKey
	private errorContentHashes: Map<string, string> = new Map(); // contentHash -> errorKey

	/**
	 * Idempotent insert with multiple deduplication strategies
	 * Returns true if order was saved, false if duplicate was detected
	 */
	saveOrder(order: OrderEvent): {
		saved: boolean;
		duplicate: boolean;
		existingOrder?: OrderEvent;
	} {
		// Strategy 1: Check idempotency key (highest priority)
		if (order.idempotencyKey) {
			const idempotencyKey = `${order.partnerId}-${order.idempotencyKey}`;
			const existingKey = this.idempotencyKeys.get(idempotencyKey);
			if (existingKey) {
				const existingOrder = this.orders.get(existingKey);
				if (existingOrder) {
					logger.debug(
						{ partnerId: order.partnerId, method: "idempotency-key" },
						"duplicate_detected",
					);
					return { saved: false, duplicate: true, existingOrder };
				}
			}
		}

		// Strategy 2: Check content hash (fallback)
		if (order.contentHash) {
			const contentHashKey = `${order.partnerId}-${order.contentHash}`;
			const existingKey = this.contentHashes.get(contentHashKey);
			if (existingKey) {
				const existingOrder = this.orders.get(existingKey);
				if (existingOrder) {
					logger.debug(
						{ partnerId: order.partnerId, method: "content-hash" },
						"duplicate_detected",
					);
					return { saved: false, duplicate: true, existingOrder };
				}
			}
		}

		// Strategy 3: Check sequence number (legacy support)
		const sequenceKey = `${order.partnerId}-${order.sequenceNumber}`;
		if (this.orders.has(sequenceKey)) {
			const existingOrder = this.orders.get(sequenceKey);
			logger.debug(
				{
					partnerId: order.partnerId,
					method: "sequence-number",
					sequence: order.sequenceNumber,
				},
				"duplicate_detected",
			);
			return { saved: false, duplicate: true, existingOrder };
		}

		// No duplicate found - save the order
		this.orders.set(sequenceKey, order);

		// Track idempotency key if provided
		if (order.idempotencyKey) {
			const idempotencyKey = `${order.partnerId}-${order.idempotencyKey}`;
			this.idempotencyKeys.set(idempotencyKey, sequenceKey);
		}

		// Track content hash if provided
		if (order.contentHash) {
			const contentHashKey = `${order.partnerId}-${order.contentHash}`;
			this.contentHashes.set(contentHashKey, sequenceKey);
		}

		logger.info(
			{
				partnerId: order.partnerId,
				sequenceNumber: order.sequenceNumber,
				amount: order.netAmount,
			},
			"order_saved",
		);
		return { saved: true, duplicate: false };
	}

	getOrders(partnerId?: string, from?: Date, to?: Date): OrderEvent[] {
		let orders = Array.from(this.orders.values());

		if (partnerId) {
			orders = orders.filter((o) => o.partnerId === partnerId);
		}

		if (from) {
			orders = orders.filter((o) => new Date(o.eventTime) >= from);
		}

		if (to) {
			orders = orders.filter((o) => new Date(o.eventTime) <= to);
		}

		// Sort by eventTime descending (most recent first)
		return orders.sort(
			(a, b) =>
				new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime(),
		);
	}

	getMonthlySummary(
		partnerId: string,
		month: number,
		year: number,
	): {
		totalGross: number;
		totalDiscount: number;
		totalNet: number;
		orderCount: number;
	} {
		const orders = this.getOrders(partnerId);

		const startDate = new Date(Date.UTC(year, month - 1, 1));
		const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

		const monthlyOrders = orders.filter((order) => {
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
			orderCount,
		};
	}

	/**
	 * Idempotent insert for errors with multiple deduplication strategies
	 * Returns information about whether the error was saved or was a duplicate
	 */
	saveError(error: ErrorEvent): {
		saved: boolean;
		duplicate: boolean;
		existingError?: ErrorEvent;
	} {
		// Strategy 1: Check idempotency key (highest priority)
		if (error.idempotencyKey) {
			const idempotencyKey = `${error.partnerId}-${error.idempotencyKey}`;
			const existingKey = this.errorIdempotencyKeys.get(idempotencyKey);
			if (existingKey) {
				const existingError = this.errors.get(existingKey);
				if (existingError) {
					logger.debug(
						{ partnerId: error.partnerId, method: "idempotency-key" },
						"error_duplicate_detected",
					);
					return { saved: false, duplicate: true, existingError };
				}
			}
		}

		// Strategy 2: Check content hash (fallback)
		if (error.contentHash) {
			const contentHashKey = `${error.partnerId}-${error.contentHash}`;
			const existingKey = this.errorContentHashes.get(contentHashKey);
			if (existingKey) {
				const existingError = this.errors.get(existingKey);
				if (existingError) {
					logger.debug(
						{ partnerId: error.partnerId, method: "content-hash" },
						"error_duplicate_detected",
					);
					return { saved: false, duplicate: true, existingError };
				}
			}
		}

		// Strategy 3: Check by partnerId + receivedTime + payload hash (fallback)
		// Generate a key from partner, time, and payload content
		const payloadHash = JSON.stringify(error.rawPayload);
		const errorKey = `${error.partnerId}-${error.receivedTime}-${payloadHash.substring(0, 50)}`;

		if (this.errors.has(errorKey)) {
			const existingError = this.errors.get(errorKey);
			return { saved: false, duplicate: true, existingError };
		}

		// No duplicate found - save the error
		this.errors.set(errorKey, error);

		// Track idempotency key if provided
		if (error.idempotencyKey) {
			const idempotencyKey = `${error.partnerId}-${error.idempotencyKey}`;
			this.errorIdempotencyKeys.set(idempotencyKey, errorKey);
		}

		// Track content hash if provided
		if (error.contentHash) {
			const contentHashKey = `${error.partnerId}-${error.contentHash}`;
			this.errorContentHashes.set(contentHashKey, errorKey);
		}

		logger.warn(
			{ partnerId: error.partnerId, errorCount: error.validationErrors.length },
			"error_saved",
		);
		errorsTotal.labels("storage").inc();
		return { saved: true, duplicate: false };
	}

	getErrors(partnerId?: string, from?: Date, to?: Date): ErrorEvent[] {
		let errors = Array.from(this.errors.values());

		if (partnerId) {
			errors = errors.filter((e) => e.partnerId === partnerId);
		}

		if (from) {
			errors = errors.filter((e) => new Date(e.receivedTime) >= from);
		}

		if (to) {
			errors = errors.filter((e) => new Date(e.receivedTime) <= to);
		}

		// Sort by receivedTime descending
		return errors.sort(
			(a, b) =>
				new Date(b.receivedTime).getTime() - new Date(a.receivedTime).getTime(),
		);
	}

	// For testing
	clear(): void {
		this.orders.clear();
		this.errors.clear();
		this.idempotencyKeys.clear();
		this.contentHashes.clear();
		this.errorIdempotencyKeys.clear();
		this.errorContentHashes.clear();
	}
}

export const storage = new Storage();
