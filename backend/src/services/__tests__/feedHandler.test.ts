import { feedHandler } from "../feedHandler";
import { sequenceManager } from "../sequenceManager";
import { storage } from "../storage";

describe("FeedHandler", () => {
	beforeEach(() => {
		// Reset state
		sequenceManager.reset("A");
		sequenceManager.reset("B");
		storage.clear();
	});

	describe("Partner A", () => {
		it("should process a valid Partner A event", () => {
			const event = {
				skuId: "SKU-1001",
				transactionTimeMs: 1733059200123,
				amount: 25.5,
			};

			const result = feedHandler.handlePartner(event, "A");

			expect(result.success).toBe(true);
			expect(result.message).toBe("Order event queued successfully.");
		});

		it("should reject invalid Partner A event", () => {
			const event = {
				skuId: "",
				transactionTimeMs: 1733059200123,
				amount: 25.5,
			};

			const result = feedHandler.handlePartner(event, "A");

			expect(result.success).toBe(false);
			expect(result.message).toBe("Invalid payload. Error event queued.");
		});
	});

	describe("Partner B", () => {
		it("should process a valid Partner B event", () => {
			const event = {
				itemCode: "IT-900",
				purchaseTime: "2026-01-28 10:12:30",
				total: 100.0,
				discount: 10.0,
			};

			const result = feedHandler.handlePartner(event, "B");

			expect(result.success).toBe(true);
			expect(result.message).toBe("Order event queued successfully.");
		});

		it("should handle Partner B event without discount", () => {
			const event = {
				itemCode: "IT-900",
				purchaseTime: "2026-01-28 10:12:30",
				total: 100.0,
			};

			const result = feedHandler.handlePartner(event, "B");

			expect(result.success).toBe(true);
			expect(result.message).toBe("Order event queued successfully.");
		});
	});
});
