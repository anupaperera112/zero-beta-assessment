import { validatePartnerA, validatePartnerB } from "../validation";

describe("Validation", () => {
	describe("Partner A", () => {
		it("should validate a correct Partner A event", () => {
			const event = {
				skuId: "SKU-1001",
				transactionTimeMs: 1733059200123,
				amount: 25.5,
			};
			const result = validatePartnerA(event);
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should reject missing skuId", () => {
			const event = {
				transactionTimeMs: 1733059200123,
				amount: 25.5,
			};
			const result = validatePartnerA(event);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("skuId is required");
		});

		it("should reject empty skuId", () => {
			const event = {
				skuId: "",
				transactionTimeMs: 1733059200123,
				amount: 25.5,
			};
			const result = validatePartnerA(event);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("skuId must be a non-empty string");
		});

		it("should reject invalid transactionTimeMs", () => {
			const event = {
				skuId: "SKU-1001",
				transactionTimeMs: "invalid",
				amount: 25.5,
			};
			const result = validatePartnerA(event);
			expect(result.isValid).toBe(false);
			expect(result.errors.some((e) => e.includes("transactionTimeMs"))).toBe(
				true,
			);
		});

		it("should reject invalid amount", () => {
			const event = {
				skuId: "SKU-1001",
				transactionTimeMs: 1733059200123,
				amount: "abc",
			};
			const result = validatePartnerA(event);
			expect(result.isValid).toBe(false);
			expect(result.errors.some((e) => e.includes("amount"))).toBe(true);
		});

		it("should reject negative amount", () => {
			const event = {
				skuId: "SKU-1001",
				transactionTimeMs: 1733059200123,
				amount: -10,
			};
			const result = validatePartnerA(event);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("amount must be non-negative");
		});
	});

	describe("Partner B", () => {
		it("should validate a correct Partner B event", () => {
			const event = {
				itemCode: "IT-900",
				purchaseTime: "2026-01-28 10:12:30",
				total: 100.0,
				discount: 10.0,
			};
			const result = validatePartnerB(event);
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should reject empty itemCode", () => {
			const event = {
        itemCode: "",
				purchaseTime: "2026-01-28 10:12:30",
				total: 100.0,
			};
			const result = validatePartnerB(event);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain("itemCode must be a non-empty string");
		});

		it("should validate Partner B event without discount", () => {
			const event = {
				itemCode: "IT-900",
				purchaseTime: "2026-01-28 10:12:30",
				total: 100.0,
			};
			const result = validatePartnerB(event);
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should reject invalid purchaseTime format", () => {
			const event = {
				itemCode: "IT-900",
				purchaseTime: "2026/01/28 10:12:30",
				total: 100.0,
			};
			const result = validatePartnerB(event);
			expect(result.isValid).toBe(false);
			expect(result.errors.some((e) => e.includes("purchaseTime"))).toBe(true);
		});

		it("should reject invalid total", () => {
			const event = {
				itemCode: "IT-900",
				purchaseTime: "2026-01-28 10:12:30",
				total: "12..3",
			};
			const result = validatePartnerB(event);
			expect(result.isValid).toBe(false);
			expect(result.errors.some((e) => e.includes("total"))).toBe(true);
		});
	});
});
