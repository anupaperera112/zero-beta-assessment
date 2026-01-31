import { Router, Request, Response } from "express";
import { feedHandler } from "../services/feedHandler";
import { apiKeyAuthPartner } from "../middleware/auth";
import { extractIdempotencyKey } from "../utils/idempotency";
import logger from "../utils/logger";

const router = Router();

/**
 * POST /api/feed/partner
 * Accept order events from Partners
 * API key authentication via X-API-Key header or apiKey query parameter
 * Idempotency key via Idempotency-Key or X-Idempotency-Key header for retry safety
 */
router.post("/partner", apiKeyAuthPartner, (req: Request, res: Response) => {
	try {
		// Extract idempotency key from headers
		const idempotencyKey = extractIdempotencyKey(req.headers);

		// Require `partner` query parameter (A or B) and dispatch via switch-case
		const qp = (req.query && (req.query.partner as string)) || "";
		const partner = qp.toUpperCase();

		if (partner !== "A" && partner !== "B") {
			return res.status(400).json({
				success: false,
				message: 'Query parameter `partner` is required and must be "A" or "B"',
			});
		}

		let result: { success: boolean; message: string };
		switch (partner) {
			case "A":
				result = feedHandler.handlePartner(req.body, "A", idempotencyKey);
				break;
			case "B":
				result = feedHandler.handlePartner(req.body, "B", idempotencyKey);
				break;
			default:
				return res
					.status(400)
					.json({ success: false, message: "Invalid partner" });
		}

		if (result.success) {
			res.status(200).json({ success: true, message: result.message });
		} else {
			res.status(400).json({ success: false, message: result.message });
		}
	} catch (error) {
		console.error("Error processing Partner event:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
