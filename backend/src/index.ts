import express from 'express';
import cors from 'cors';

import dotenv from 'dotenv';
dotenv.config();

import feedRoutes from './routes/feed';
import ordersRoutes from './routes/orders';
import errorsRoutes from './routes/errors';
import { partnerService } from './services/partnerService';
import { errorProcessor } from './services/errorProcessor';
import { orderProcessor } from './services/orderProcessor';
import { validOrdersStream, errorOrdersStream } from './services/streams';
import { ErrorEvent, OrderEvent } from './types';


const app = express();
const PORT = process.env.PORT || 3001;

// Initialize stream subscriptions (decoupled architecture)
// This sets up the event-driven flow where processors consume from streams
errorOrdersStream.subscribe((error: ErrorEvent) => {errorProcessor.processError(error)});
validOrdersStream.subscribe((order: OrderEvent) => {
  orderProcessor.processOrder(order);
});

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/feed', feedRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/errors', errorsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`\nFeed endpoints (with optional API key authentication):`);
  console.log(`  POST http://localhost:${PORT}/api/feed/partner-a`);
  console.log(`  POST http://localhost:${PORT}/api/feed/partner-b`);
  console.log(`  API Key: Send via X-API-Key header or apiKey query parameter`);
  console.log(`\nPartner Authentication Status:`);
  const partners = partnerService.getAllPartners();
  partners.forEach(partner => {
    const authStatus = partner.apiKey ? 'API Key Required' : 'No API Key (Open Access)';
    console.log(`  Partner ${partner.id}: ${authStatus}`);
  });
  console.log(`\nQuery endpoints:`);
  console.log(`  GET http://localhost:${PORT}/api/orders`);
  console.log(`  GET http://localhost:${PORT}/api/orders/summary/monthly`);
  console.log(`  GET http://localhost:${PORT}/api/errors`);
});
