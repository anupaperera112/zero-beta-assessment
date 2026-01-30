import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import feedRoutes from './routes/feed';
import ordersRoutes from './routes/orders';
import errorsRoutes from './routes/errors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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
  console.log(`Feed endpoints:`);
  console.log(`  POST http://localhost:${PORT}/api/feed/partner-a`);
  console.log(`  POST http://localhost:${PORT}/api/feed/partner-b`);
  console.log(`Query endpoints:`);
  console.log(`  GET http://localhost:${PORT}/api/orders`);
  console.log(`  GET http://localhost:${PORT}/api/orders/summary/monthly`);
  console.log(`  GET http://localhost:${PORT}/api/errors`);
});
