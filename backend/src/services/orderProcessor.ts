import { OrderEvent } from "../types";
import { storage } from "./storage";
import { logger } from "../utils/logger";
import { errorsTotal } from "../metrics";

/**
 * Order Processor - consumes valid orders from stream and persists them
 * Designed to be idempotent (safe to retry)
 *
 * Idempotency Strategy:
 * 1. Client-provided idempotency key (Idempotency-Key header) - highest priority
 * 2. Content hash of payload - automatic fallback for duplicate detection
 * 3. Sequence number - legacy support
 *
 * If the same event is reprocessed (retry), it will be detected as a duplicate
 * and the existing order will be returned without creating a new record.
 */
export class OrderProcessor {
	start(): void {
		// Subscribe to valid_orders stream
		// In production, this would be a separate service/worker consuming from SQS/Kinesis
		// For now, we'll process synchronously when orders are published
	}

	/**
	 * Process an order with idempotency checks
	 * Returns information about whether the order was saved or was a duplicate
	 */
	processOrder(order: OrderEvent): {
		saved: boolean;
		duplicate: boolean;
		existingOrder?: OrderEvent;
		idempotencyMethod?: string;
	} {
		const result = storage.saveOrder(order);

		if (result.duplicate) {
			// Determine which method detected the duplicate
			let method = "sequence-number";
			if (order.idempotencyKey) {
				method = "idempotency-key";
			} else if (order.contentHash) {
				method = "content-hash";
			}

			logger.info(
				{
					partnerId: order.partnerId,
					sequenceNumber: order.sequenceNumber,
					method,
				},
				"duplicate_order_detected",
			);
			errorsTotal.labels("duplicate").inc();

			return {
				saved: false,
				duplicate: true,
				existingOrder: result.existingOrder,
				idempotencyMethod: method,
			};
		}

		// Log successful save
		const idempotencyInfo = order.idempotencyKey
			? `idempotency-key: ${order.idempotencyKey}`
			: order.contentHash
				? `content-hash: ${order.contentHash.substring(0, 8)}...`
				: "sequence-number only";

		logger.info(
			{
				partnerId: order.partnerId,
				sequenceNumber: order.sequenceNumber,
				idempotencyMethod: order.idempotencyKey
					? "idempotency-key"
					: order.contentHash
						? "content-hash"
						: "sequence-number",
				amount: order.netAmount,
			},
			"order_processed_successfully",
		);

		return {
			saved: true,
			duplicate: false,
			idempotencyMethod: order.idempotencyKey
				? "idempotency-key"
				: order.contentHash
					? "content-hash"
					: "sequence-number",
		};
	}
}

export const orderProcessor = new OrderProcessor();
