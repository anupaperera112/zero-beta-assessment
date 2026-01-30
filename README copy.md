# ZeroBeta Order Processing Platform

A platform that ingests real-time purchase/order events from two partners, validates them, converts them into a single internal schema, and makes them available to a dashboard.

## Project Structure

```
zerobeta/
├── backend/          # Node.js/TypeScript backend API
├── frontend/         # React/TypeScript frontend dashboard
└── README.md         # This file
```

## Features

- **Partner Integration**: Accepts order events from Partner A and Partner B with different formats
- **Validation**: Comprehensive validation of incoming events (data types, required fields, numeric validation)
- **Transformation**: Converts partner-specific formats to unified internal schema
- **Sequence Management**: Assigns sequence numbers per partner (starts at 1)
- **Stream Processing**: Publishes valid orders to `valid_orders` stream and errors to `error_orders` stream
- **Persistence**: Stores processed orders and errors for querying
- **REST API**: Exposes endpoints for querying orders, monthly summaries, and errors
- **React Dashboard**: Clean UI for viewing recent orders, monthly summaries, and validation errors

## Prerequisites

- Node.js 18+ and npm
- (Optional) Docker and docker-compose for containerized deployment

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

4. Start the development server:
```bash
npm run dev
```

The backend will start on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## Running Tests

### Backend Tests

From the `backend` directory:
```bash
npm test
```

To run tests in watch mode:
```bash
npm run test:watch
```

## API Endpoints

### Feed Endpoints

- **POST** `/api/feed/partner-a` - Accept order events from Partner A
- **POST** `/api/feed/partner-b` - Accept order events from Partner B

### Query Endpoints

- **GET** `/api/orders` - Fetch orders (query params: `partnerId`, `from`, `to`)
- **GET** `/api/orders/summary/monthly` - Fetch monthly summary (query params: `partnerId`, `month` in MM-YYYY format)
- **GET** `/api/errors` - Fetch validation errors (query params: `partnerId`, `from`, `to`)

### Health Check

- **GET** `/health` - Health check endpoint

## Example API Usage

### Submit an order from Partner A:
```bash
curl -X POST http://localhost:3001/api/feed/partner-a \
  -H "Content-Type: application/json" \
  -d '{
    "skuId": "SKU-1001",
    "transactionTimeMs": 1733059200123,
    "amount": 25.50
  }'
```

### Submit an order from Partner B:
```bash
curl -X POST http://localhost:3001/api/feed/partner-b \
  -H "Content-Type: application/json" \
  -d '{
    "itemCode": "IT-900",
    "purchaseTime": "2026-01-28 10:12:30",
    "total": 100.00,
    "discount": 10.00
  }'
```

### Query orders:
```bash
curl "http://localhost:3001/api/orders?partnerId=A"
```

### Get monthly summary:
```bash
curl "http://localhost:3001/api/orders/summary/monthly?partnerId=A&month=01-2024"
```

## Frontend Dashboard

The React dashboard provides three main views:

1. **Recent Orders**: View and filter recent orders by partner ID
2. **Monthly Summary**: View monthly sales summaries by partner and month
3. **Errors View**: View validation errors with detailed error messages

Access the dashboard at `http://localhost:3000`

## Data Formats

### Partner A Format
```json
{
  "skuId": "SKU-1001",
  "transactionTimeMs": 1733059200123,
  "amount": 25.50
}
```

### Partner B Format
```json
{
  "itemCode": "IT-900",
  "purchaseTime": "2026-01-28 10:12:30",
  "total": 100.00,
  "discount": 10.00
}
```

### Internal Schema (OrderEvent)
```json
{
  "productCode": "SKU-1001",
  "eventTime": "2024-12-01T12:00:00.123Z",
  "grossAmount": 25.50,
  "discount": 0,
  "netAmount": 25.50,
  "partnerId": "A",
  "sequenceNumber": 1,
  "receivedTime": "2024-12-01T12:00:00.123Z",
  "streamOffset": 0,
  "processedTime": "2024-12-01T12:00:00.123Z"
}
```

## Validation Rules

1. **Data type validations**: All fields must match expected types
2. **Missing required fields**: Required fields must be present
3. **Null/empty checks**: Required fields cannot be null or empty
4. **Numeric validation**: Numeric fields must be valid numbers (rejects "abc", "12..3", etc.)

## Assumptions and Trade-offs

### Assumptions

1. **In-memory storage**: For local development, orders and errors are stored in memory. In production, this would be replaced with a database.
2. **In-memory streams**: The `valid_orders` and `error_orders` streams are implemented as in-memory queues. In AWS, these would be replaced with SQS, EventBridge, Kinesis, or MSK.
3. **Synchronous processing**: Order processing happens synchronously when events are received. In production, this would be asynchronous with separate worker services.
4. **No authentication**: For simplicity, no authentication is implemented. In production, API keys or OAuth would be used.
5. **UTC timezone**: Partner B timestamps are assumed to be in UTC when converting to ISO 8601.

### Trade-offs

1. **Idempotency**: Implemented using composite key (partnerId + sequenceNumber). In production, would use distributed locks or database constraints.
2. **Sequence numbers**: Managed in-memory. In production, would use distributed counters (e.g., DynamoDB atomic counters).
3. **Error storage**: Errors are stored in memory. In production, would use a separate error tracking system.
4. **No pagination**: API endpoints return all matching results. In production, would implement pagination for large datasets.

## Design Document

See [DESIGN.md](./DESIGN.md) for detailed AWS deployment architecture and design decisions.

## Docker Deployment (Optional)

See the `docker-compose.yml` file for containerized deployment. To run:

```bash
docker-compose up
```

This will start both backend and frontend services.

## Development Notes

- Backend uses TypeScript with Express
- Frontend uses React with TypeScript and Vite
- All timestamps are stored in ISO 8601 UTC format
- Sequence numbers start at 1 per partner and increment for each valid order

## License

ISC
