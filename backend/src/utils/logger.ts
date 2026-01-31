import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";
const isTest = process.env.NODE_ENV === "test" || process.argv.includes("jest");

export const logger = pino({
	transport: isTest
		? undefined // Disable worker threads in test environment
		: isDev
			? { target: "pino-pretty", options: { colorize: true } }
			: undefined,
});

export default logger;
