import express from "express";
import cors from "cors";

import dotenv from "dotenv";
dotenv.config();

import feedRoutes from "./routes/feed";
import ordersRoutes from "./routes/orders";
import errorsRoutes from "./routes/errors";
import { partnerService } from "./services/partnerService";
import { errorProcessor } from "./services/errorProcessor";
import { orderProcessor } from "./services/orderProcessor";
import { validOrdersStream, errorOrdersStream } from "./services/streams";
import { ErrorEvent, OrderEvent } from "./types";
import { logger } from "./utils/logger";
import requestLogger from "./middleware/requestLogger";
import register, { httpRequestDurationSeconds } from "./metrics";

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize stream subscriptions (decoupled architecture)
// This sets up the event-driven flow where processors consume from streams
errorOrdersStream.subscribe((error: ErrorEvent) => {
	errorProcessor.processError(error);
});
validOrdersStream.subscribe((order: OrderEvent) => {
	orderProcessor.processOrder(order);
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logging + correlation id
app.use(requestLogger);

// Expose metrics for Prometheus scraping
app.get("/metrics", async (req, res) => {
	try {
		res.set("Content-Type", register.contentType);
		res.send(await register.metrics());
	} catch (e) {
		logger.error({ err: e }, "failed_to_collect_metrics");
		res.status(500).send("metrics error");
	}
});

// Routes
app.use("/api/feed", feedRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/errors", errorsRoutes);

// Health check
app.get("/health", (req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
	logger.info({ port: PORT }, "server_started");
	logger.info({ url: `http://localhost:${PORT}/health` }, "health_check");
	logger.info(
		{ endpoints: ["/api/feed/partner"] },
		"feed_endpoints",
	);
	const partners = partnerService.getAllPartners();
	partners.forEach((partner) => {
		const authStatus = partner.apiKey
			? "API Key Required"
			: "No API Key (Open Access)";
		logger.info({ partner: partner.id, authStatus }, "partner_status");
	});
	logger.info(
		{
			endpoints: ["/api/orders", "/api/orders/summary/monthly", "/api/errors"],
		},
		"query_endpoints",
	);
});
