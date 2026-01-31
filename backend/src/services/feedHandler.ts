import { PartnerAEvent, PartnerBEvent, OrderEvent, ErrorEvent } from "../types";
import { validatePartnerA, validatePartnerB } from "../utils/validation";
import { transformPartnerA, transformPartnerB } from "../utils/transform";
import { sequenceManager } from "./sequenceManager";
import { validOrdersStream, errorOrdersStream } from "./streams";
import { generateContentHash } from "../utils/idempotency";
import { logger } from "../utils/logger";
import { eventsProcessed, errorsTotal } from "../metrics";

export class FeedHandler {
	/**
	 * Process an event from either Partner A or B
	 * @param payload - The order payload
	 * @param partnerId - Partner identifier ('A' or 'B')
	 * @param idempotencyKey - Optional idempotency key from request headers
	 */
	handlePartner(
		payload: unknown,
		partnerId: "A" | "B",
		idempotencyKey?: string,
	): { success: boolean; message: string } {
		const receivedTime = new Date().toISOString();

		switch (partnerId) {
			case "A":
				return this.processPartnerA(payload, receivedTime, idempotencyKey);
			case "B":
				return this.processPartnerB(payload, receivedTime, idempotencyKey);
			default:
				return {
					success: false,
					message: "Invalid partner ID",
				};
		}
	}

	private processPartnerA(
		payload: unknown,
		receivedTime: string,
		idempotencyKey?: string,
	): { success: boolean; message: string } {
		const validation = validatePartnerA(payload);

		if (!validation.isValid) {
			const contentHash = generateContentHash(payload);

			const errorEvent: ErrorEvent = {
				partnerId: "A",
				rawPayload: payload,
				receivedTime,
				validationErrors: validation.errors,
				idempotencyKey,
				contentHash,
			};

			logger.warn(
				{ partner: "A", errors: validation.errors },
				"validation_failed",
			);
			errorsTotal.labels("validation").inc();
			errorOrdersStream.publish(errorEvent);
			return {
				success: false,
				message: "Invalid payload. Error event queued.",
			};
		}

		const event = payload as PartnerAEvent;
		const sequenceNumber = sequenceManager.getNextSequence("A");
		const contentHash = generateContentHash(payload);

		const orderEvent = transformPartnerA(
			event,
			"A",
			sequenceNumber,
			receivedTime,
			idempotencyKey,
			contentHash,
		);

		logger.info(
			{ partner: "A", sequenceNumber, amount: orderEvent.grossAmount },
			"order_event_created",
		);
		eventsProcessed.labels("A").inc();
		validOrdersStream.publish(orderEvent);
		return { success: true, message: "Order event queued successfully." };
	}

	private processPartnerB(
		payload: unknown,
		receivedTime: string,
		idempotencyKey?: string,
	): { success: boolean; message: string } {
		const validation = validatePartnerB(payload);

		if (!validation.isValid) {
			const contentHash = generateContentHash(payload);

			const errorEvent: ErrorEvent = {
				partnerId: "B",
				rawPayload: payload,
				receivedTime,
				validationErrors: validation.errors,
				idempotencyKey,
				contentHash,
			};

			logger.warn(
				{ partner: "B", errors: validation.errors },
				"validation_failed",
			);
			errorsTotal.labels("validation").inc();
			errorOrdersStream.publish(errorEvent);

			return {
				success: false,
				message: "Invalid payload. Error event queued.",
			};
		}

		const event = payload as PartnerBEvent;
		const sequenceNumber = sequenceManager.getNextSequence("B");
		const contentHash = generateContentHash(payload);

		const orderEvent = transformPartnerB(
			event,
			"B",
			sequenceNumber,
			receivedTime,
			idempotencyKey,
			contentHash,
		);

		logger.info(
			{ partner: "B", sequenceNumber, amount: orderEvent.netAmount },
			"order_event_created",
		);
		eventsProcessed.labels("B").inc();
		validOrdersStream.publish(orderEvent);
		return { success: true, message: "Order event queued successfully." };
	}
}

export const feedHandler = new FeedHandler();
