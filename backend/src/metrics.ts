import client from 'prom-client';

const collectDefault = true;
if (collectDefault) client.collectDefaultMetrics();

export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

export const eventsProcessed = new client.Counter({
  name: 'events_processed_total',
  help: 'Total number of processed events',
  labelNames: ['partner']
});

export const errorsTotal = new client.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type']
});

export const register = client.register;

export default register;
