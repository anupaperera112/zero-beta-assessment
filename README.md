# ZeroBeta — Order Processing Platform

ZeroBeta ingests real-time order events from two partner formats, validates and normalizes them into a single internal schema, assigns partner-specific sequence numbers, and exposes the results via a small API plus a React dashboard.

## Repository layout

```
backend/    # Node.js + TypeScript backend API
frontend/   # React + TypeScript dashboard (Vite)
DESIGN.md   # Architecture and design notes
README.md   # This file
```

## Quick start

Prerequisites: Node.js 18+ and npm.

Backend (dev):
create the .env file:
```bash
PORT = 3001
PARTNER_A_API_KEY=secret-key-pat-a
PARTNER_B_API_KEY=secret-key-pat-b
DASHBOARD_API_KEY=secret-key-dashboard
```

```bash
cd backend
npm install
npm run dev
```

Frontend (dev):
create the .env file:
```bash
VITE_API_URL = http://localhost:3001
VITE_DASHBOARD_API_KEY=secret-key-dashboard
```

```bash
cd frontend
npm install
npm run dev
```

Backend default: http://localhost:3001
Frontend default: http://localhost:3000

or with docker
```bash
docker compose up --build
```

## What it does (high level)

- Accepts partner-specific events for Partner A and Partner B.
- Validates payloads (types, required fields, numeric checks).
- Transforms events to an internal `OrderEvent` schema.
- Assigns an incremental `sequenceNumber` per partner (starts at 1).
- Publishes valid orders and errors to in-memory streams and persists them in memory for querying.
- Exposes REST endpoints for queries and a dashboard UI for viewing results.

## Important endpoints

- POST /api/feed/partner-a — submit Partner A events
- POST /api/feed/partner-b — submit Partner B events
- GET /api/orders — list orders (optional query: `partnerId`, `from`, `to`)
- GET /api/orders/summary/monthly — monthly summary (query: `partnerId`, `month`=MM-YYYY)
- GET /api/errors — list validation errors (optional query: `partnerId`, `from`, `to`)
- GET /health — health check

Example: submit Partner A event

```bash
curl -X POST http://localhost:3001/api/feed/partner?partner=A \
  -H "X-API-Key: secret-key-pat-a" \
  -H "Content-Type: application/json" \
  -d '{"skuId":"SKU-1001","transactionTimeMs":1733059200123,"amount":25.50}'
```

Example: submit Partner B event

```bash
curl -X POST http://localhost:3001/api/feed/partner?partner=B \
  -H "X-API-Key: secret-key-pat-b" \
  -H "Content-Type: application/json" \
  -d '{"itemCode":"IT-900","purchaseTime":"2026-01-28 10:12:30","total":100.00,"discount":10.00}'
```

## Data formats

Partner A sample:

```json
{
	"skuId": "SKU-1001",
	"transactionTimeMs": 1733059200123,
	"amount": 25.5
}
```

Partner B sample:

```json
{
	"itemCode": "IT-900",
	"purchaseTime": "2026-01-28 10:12:30",
	"total": 100.0,
	"discount": 10.0
}
```

Internal `OrderEvent` (normalized) includes fields such as:

- `productCode`, `eventTime` (ISO8601), `grossAmount`, `discount`, `netAmount`, `partnerId`, `sequenceNumber`, `receivedTime`, `streamOffset`, `processedTime`

## Validation rules

- Required fields must be present and non-empty.
- Types must match expected types (numbers, strings, timestamps).
- Numeric values must be valid numbers (reject malformed numerics).

## Assumptions & trade-offs

- Storage: in-memory for development (replace with a DB in prod).
- Streams: in-memory queues for dev; production would use SQS/EventBridge/Kinesis/MSK.
- Processing: synchronous for simplicity; production would use async workers.
- No authentication on APIs (add API keys or OAuth in production).

## Tests

Backend tests (Jest):

```bash
cd backend
npm test
```

## Next steps you might want

- Commit the README changes and run the backend tests: `cd backend && npm test`.
- Add pagination to API responses for large datasets.
- Replace in-memory persistence with a small DB (SQLite/DynamoDB/Postgres) for demo production.

## python simulator
create the venv
```bash
pip install -r requirements.txt
```

# Only valid requests (happy path)
python partner-sim.py --mode valid --count 10

# Chaos testing (random + invalid)
python partner-sim.py --mode random --count 50 --delay 0.5

