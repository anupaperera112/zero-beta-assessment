import { orderProcessor } from "../orderProcessor";
import { storage } from "../storage";

describe("OrderProcessor", () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const baseOrder = () => ({
		productCode: "P-1",
		eventTime: new Date().toISOString(),
		grossAmount: 100,
		discount: 10,
		netAmount: 90,
		partnerId: "A",
		sequenceNumber: 1,
		receivedTime: new Date().toISOString(),
		streamOffset: 0,
		processedTime: new Date().toISOString(),
	});

	it("saves order and reports idempotency-key when provided", () => {
		const order = { ...baseOrder(), idempotencyKey: "key-123" } as any;
		jest
			.spyOn(storage, "saveOrder")
			.mockReturnValue({ saved: true, duplicate: false });

		const res = orderProcessor.processOrder(order);

		expect(res.saved).toBe(true);
		expect(res.duplicate).toBe(false);
		expect(res.idempotencyMethod).toBe("idempotency-key");
	});

	it("saves order and reports content-hash when no idempotency key", () => {
		const order = { ...baseOrder(), contentHash: "abcdef" } as any;
		jest
			.spyOn(storage, "saveOrder")
			.mockReturnValue({ saved: true, duplicate: false });

		const res = orderProcessor.processOrder(order);

		expect(res.saved).toBe(true);
		expect(res.duplicate).toBe(false);
		expect(res.idempotencyMethod).toBe("content-hash");
	});

	it("saves order and reports sequence-number when no idempotency or content hash", () => {
		const order = { ...baseOrder() } as any;
		jest
			.spyOn(storage, "saveOrder")
			.mockReturnValue({ saved: true, duplicate: false });

		const res = orderProcessor.processOrder(order);

		expect(res.saved).toBe(true);
		expect(res.duplicate).toBe(false);
		expect(res.idempotencyMethod).toBe("sequence-number");
	});

	it("returns duplicate info and method 'idempotency-key' when storage reports duplicate and idempotencyKey present", () => {
		const existing = { ...baseOrder(), sequenceNumber: 1 } as any;
		const order = { ...baseOrder(), idempotencyKey: "k" } as any;
		jest
			.spyOn(storage, "saveOrder")
			.mockReturnValue({
				saved: false,
				duplicate: true,
				existingOrder: existing,
			});

		const res = orderProcessor.processOrder(order);

		expect(res.saved).toBe(false);
		expect(res.duplicate).toBe(true);
		expect(res.existingOrder).toBe(existing);
		expect(res.idempotencyMethod).toBe("idempotency-key");
	});

	it("returns duplicate info and method 'content-hash' when storage reports duplicate and only contentHash present", () => {
		const existing = { ...baseOrder(), sequenceNumber: 2 } as any;
		const order = { ...baseOrder(), contentHash: "chash" } as any;
		jest
			.spyOn(storage, "saveOrder")
			.mockReturnValue({
				saved: false,
				duplicate: true,
				existingOrder: existing,
			});

		const res = orderProcessor.processOrder(order);

		expect(res.saved).toBe(false);
		expect(res.duplicate).toBe(true);
		expect(res.existingOrder).toBe(existing);
		expect(res.idempotencyMethod).toBe("content-hash");
	});

	it("returns duplicate info and method 'sequence-number' when storage reports duplicate and no keys present", () => {
		const existing = { ...baseOrder(), sequenceNumber: 3 } as any;
		const order = { ...baseOrder(), sequenceNumber: 3 } as any;
		jest
			.spyOn(storage, "saveOrder")
			.mockReturnValue({
				saved: false,
				duplicate: true,
				existingOrder: existing,
			});

		const res = orderProcessor.processOrder(order);

		expect(res.saved).toBe(false);
		expect(res.duplicate).toBe(true);
		expect(res.existingOrder).toBe(existing);
		expect(res.idempotencyMethod).toBe("sequence-number");
	});
});
