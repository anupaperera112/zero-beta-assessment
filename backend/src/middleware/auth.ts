import { Request, Response, NextFunction } from "express";
import { partnerService } from "../services/partnerService";

/**
 * API key authentication middleware
 *
 * Validates API keys if configured for the partner.
 * If no API key is configured for the partner, access is allowed.
 *
 * API key can be provided via:
 * - Header: X-API-Key
 * - Query parameter: apiKey
 */
export const apiKeyAuthPartner = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const partnerId = (req.query && (req.query.partner as string)) || "";

	if (!partnerId) {
		return res.status(400).json({ error: "Invalid partner endpoint" });
	}

	// Check if partner exists
	if (!partnerService.partnerExists(partnerId)) {
		return res.status(404).json({ error: `Partner ${partnerId} not found` });
	}

	// Extract API key from header or query parameter
	const apiKey =
		(req.headers["x-api-key"] as string) || (req.query.apiKey as string);

	// Validate API key (returns true if partner has no API key configured)
	if (!partnerService.validateApiKey(partnerId, apiKey)) {
		return res.status(401).json({
			error: "Invalid or missing API key",
			message: partnerService.requiresApiKey(partnerId)
				? "API key is required for this partner"
				: "Invalid API key provided",
		});
	}

	// Attach partner ID to request for use in handlers
	(req as any).partnerId = partnerId;

	next();
};

export const apiKeyAuthDashboard = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	// Extract API key from header or query parameter
	const apiKey =
		(req.headers["x-api-key"] as string) || (req.query.apiKey as string);

	// For dashboard endpoints, require a valid API key
	// (could be validated against a master key or list of valid keys)
	if (!apiKey) {
		return res.status(401).json({
			error: "Unauthorized",
			message:
				"API key is required. Provide via X-API-Key header or apiKey query parameter",
		});
	}

	// Validate the API key against the dashboard master API key
	const dashboardApiKey = process.env.DASHBOARD_API_KEY;
	if (dashboardApiKey && apiKey !== dashboardApiKey) {
		return res.status(401).json({
			error: "Unauthorized",
			message: "Invalid API key",
		});
	}

	// If no DASHBOARD_API_KEY env var is set, accept any non-empty key (for development)
	if (!dashboardApiKey) {
		console.warn(
			"Warning: DASHBOARD_API_KEY not set. All non-empty API keys will be accepted.",
		);
	}

	// Attach API key to request for logging/auditing
	(req as any).apiKey = apiKey;

	next();
};
