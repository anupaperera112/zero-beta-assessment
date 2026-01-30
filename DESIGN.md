# ZeroBeta Platform - Design Document

## Overview

This document describes the architecture and design decisions for the ZeroBeta Order Processing Platform, including how it would be deployed on AWS.

## System Architecture

### High-Level Architecture

```
Partner A/B → API Gateway → Feed Handler → Validation → Transform → Streams
                                                              ↓
                                                      Order Processor → Storage
                                                              ↓
                                                      Error Processor → Error Storage
                                                              ↓
                                                      REST API → React Dashboard
```

## Component Design

### 1. Partner Onboarding

**Current Implementation**: Hardcoded partner IDs (A and B) with basic endpoint separation.

**Production Design**:
- Store partner configurations in DynamoDB (partnerId, API keys, webhook URLs, schema mappings)
- API Gateway with API keys for authentication
- Partner-specific endpoints or header-based routing
- Rate limiting per partner

### 2. Feed Handler

**Current Implementation**: HTTP endpoints that accept JSON payloads and process synchronously.

**Production Design**:
- API Gateway REST API with Lambda integration or ECS/Fargate containers
- Request validation at API Gateway level
- Async processing with SQS queues
- Dead-letter queues for failed processing

### 3. Validation & Transformation

**Current Implementation**: Synchronous validation and transformation in the feed handler.

**Production Design**:
- Separate validation Lambda/container
- Schema validation using JSON Schema or similar
- Transformation logic as reusable functions
- Validation rules stored in Parameter Store or DynamoDB

### 4. Streams/Topics

**Current Implementation**: In-memory queues with subscriber pattern.

**Production Design Options**:

**Option A: Amazon SQS**
- **Pros**: Simple, managed, built-in retry, dead-letter queues
- **Cons**: Not ideal for high-throughput, limited ordering guarantees
- **Use Case**: Good for moderate volume (< 1000 messages/sec per partner)

**Option B: Amazon EventBridge**
- **Pros**: Event-driven, rule-based routing, integration with many AWS services
- **Cons**: Less control over message ordering
- **Use Case**: Good for event-driven architecture with multiple consumers

**Option C: Amazon Kinesis Data Streams**
- **Pros**: High throughput, ordered processing, replay capability
- **Cons**: More complex, higher cost, requires shard management
- **Use Case**: High-volume, real-time processing needs

**Option D: Amazon MSK (Managed Kafka)**
- **Pros**: Industry standard, high throughput, strong ordering, multiple consumers
- **Cons**: Most complex, higher operational overhead
- **Use Case**: Enterprise-grade, high-volume, multiple consumer groups

**Recommendation**: Start with **SQS** for simplicity and cost-effectiveness. Migrate to **Kinesis** or **MSK** if volume exceeds SQS limits or ordering becomes critical.

### 5. Order Processor

**Current Implementation**: Synchronous processing that saves to in-memory storage.

**Production Design**:
- Separate worker service (Lambda or ECS/Fargate)
- Consumes from `valid_orders` stream
- Idempotent processing using:
  - **DynamoDB**: Conditional writes with composite key (partnerId + sequenceNumber)
  - **RDS**: Unique constraint on (partnerId, sequenceNumber)
- Batch processing for efficiency
- Retry logic with exponential backoff

### 6. Error Processor

**Current Implementation**: Synchronous error storage.

**Production Design**:
- Separate worker service consuming from `error_orders` stream
- Store errors in DynamoDB with TTL for automatic cleanup
- Alert on high error rates (CloudWatch alarms)
- Integration with error tracking service (e.g., Sentry)

### 7. Storage

**Current Implementation**: In-memory Map and arrays.

**Production Design Options**:

**Option A: Amazon DynamoDB**
- **Pros**: 
  - Serverless, auto-scaling
  - Fast queries with GSI
  - Built-in TTL for error cleanup
  - Strong consistency for sequence numbers
- **Cons**: 
  - Query patterns limited by key design
  - Cost at scale
- **Use Case**: High-throughput writes, simple queries, serverless architecture

**Option B: Amazon RDS (PostgreSQL/MySQL)**
- **Pros**: 
  - SQL queries, complex aggregations
  - ACID transactions
  - Familiar for most developers
- **Cons**: 
  - Requires capacity planning
  - Scaling is more complex
- **Use Case**: Complex queries, relational data, existing SQL expertise

**Recommendation**: Use **DynamoDB** for orders (high write volume, simple queries) and **RDS** if complex analytics are needed. For errors, use **DynamoDB** with TTL.

**Table Design (DynamoDB)**:
- **Orders Table**:
  - Partition Key: `partnerId`
  - Sort Key: `sequenceNumber`
  - GSI: `eventTime-index` (for time-range queries)
- **Errors Table**:
  - Partition Key: `partnerId`
  - Sort Key: `receivedTime`
  - TTL: `expirationTime` (30 days)

### 8. REST API

**Current Implementation**: Express.js server with in-memory queries.

**Production Design**:
- API Gateway with Lambda integration or ECS/Fargate
- Caching with CloudFront for frequently accessed data
- Rate limiting per API key
- Request/response logging

### 9. Frontend

**Current Implementation**: React app served by Vite dev server.

**Production Design**:
- **Hosting**: S3 + CloudFront
  - Build React app: `npm run build`
  - Upload `dist/` to S3 bucket
  - Configure CloudFront distribution
  - Custom domain with Route 53
- **API Integration**: 
  - API Gateway endpoint
  - CORS configured
  - Environment variables for API URL

## AWS Deployment Architecture

### Compute

**Option A: AWS Lambda (Serverless)**
- **Pros**: 
  - No server management
  - Auto-scaling
  - Pay per request
  - Good for variable traffic
- **Cons**: 
  - Cold starts
  - 15-minute timeout limit
  - Limited control over runtime
- **Use Case**: Low to moderate traffic, event-driven processing

**Option B: ECS/Fargate (Containers)**
- **Pros**: 
  - More control
  - No cold starts
  - Long-running processes
  - Better for high throughput
- **Cons**: 
  - More operational overhead
  - Cost even when idle
- **Use Case**: High traffic, predictable load, need for long-running processes

**Recommendation**: Use **Lambda** for feed handlers and API endpoints (stateless, request-driven). Use **ECS/Fargate** for order/error processors (long-running, continuous processing).

### Architecture Diagram

```
┌─────────────┐
│ Partner A/B │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  API Gateway    │ (Authentication, Rate Limiting)
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Feed Handler   │ (Lambda or ECS)
│  (Validation &  │
│   Transform)    │
└──────┬──────────┘
       │
       ├─────────────────┐
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│ valid_orders│   │error_orders │
│   (SQS)     │   │   (SQS)     │
└──────┬──────┘   └──────┬──────┘
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│   Order     │   │   Error     │
│  Processor  │   │  Processor  │
│ (ECS/Fargate)│  │(ECS/Fargate)│
└──────┬──────┘   └──────┬──────┘
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  DynamoDB   │   │  DynamoDB   │
│  (Orders)   │   │  (Errors)   │
└──────┬──────┘   └─────────────┘
       │
       ▼
┌─────────────┐
│  REST API   │ (API Gateway + Lambda)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  CloudFront │
│  + S3       │ (React App)
└─────────────┘
```

## Configuration & Secrets

### Environment Variables
- Store in **AWS Systems Manager Parameter Store** (for non-sensitive config)
- Store in **AWS Secrets Manager** (for API keys, database credentials)
- Use IAM roles for service-to-service authentication

### Configuration Examples
- Partner configurations (API keys, endpoints)
- Validation rules
- Stream names
- Database connection strings

## Observability

### Logging
- **CloudWatch Logs**: Centralized logging for all services
- Structured logging (JSON format)
- Log retention: 30 days (configurable)

### Metrics
- **CloudWatch Metrics**:
  - Request count, latency (API Gateway)
  - Processing time (Lambda/ECS)
  - Queue depth (SQS)
  - Error rate
  - Order volume per partner
- **Custom Metrics**:
  - Orders processed per minute
  - Validation failure rate
  - Average processing time

### Alarms
- High error rate (> 5% of requests)
- Queue depth threshold (SQS > 1000 messages)
- API latency > 1 second (p95)
- Processing failures
- Storage capacity warnings

### Tracing
- **AWS X-Ray**: Distributed tracing for request flows
- Track requests from API Gateway through Lambda/ECS to DynamoDB

### Dashboards
- **CloudWatch Dashboards**:
  - Real-time order processing rate
  - Error rate by partner
  - API performance
  - Queue metrics

## CI/CD Pipeline

### Pipeline Stages

1. **Source**: GitHub/GitLab/Bitbucket
2. **Build**:
   - Install dependencies
   - Run linters (ESLint, Prettier)
   - Run unit tests
   - Build TypeScript
3. **Test**:
   - Integration tests
   - End-to-end tests (optional)
4. **Package**:
   - Create Docker images (if using ECS)
   - Package Lambda functions
5. **Deploy**:
   - Deploy to staging environment
   - Run smoke tests
   - Deploy to production (with approval)

### Deployment Strategy

**Blue/Green Deployment** (ECS):
- Deploy new version alongside old
- Route traffic gradually (10% → 50% → 100%)
- Rollback by switching traffic back

**Canary Deployment** (Lambda):
- Deploy new version to 10% of traffic
- Monitor metrics
- Gradually increase to 100%

**Infrastructure as Code**:
- **AWS CDK** or **Terraform** for infrastructure
- Version controlled
- Repeatable deployments

### Pipeline Tools
- **AWS CodePipeline** + **CodeBuild** + **CodeDeploy**
- Or **GitHub Actions** / **GitLab CI** with AWS deployment

## Security Considerations

1. **Authentication**:
   - API Gateway with API keys or Cognito
   - IAM roles for service-to-service communication

2. **Network Security**:
   - VPC for ECS tasks (if using ECS)
   - Security groups with least privilege
   - Private subnets for databases

3. **Data Encryption**:
   - Encryption at rest (DynamoDB, S3)
   - Encryption in transit (TLS/HTTPS)

4. **Secrets Management**:
   - AWS Secrets Manager for sensitive data
   - No hardcoded credentials

5. **Input Validation**:
   - Validate at API Gateway
   - Sanitize inputs
   - Rate limiting to prevent abuse

## Scalability Considerations

1. **Auto-scaling**:
   - Lambda: Automatic
   - ECS: Auto-scaling based on CPU/memory
   - DynamoDB: On-demand or provisioned capacity

2. **Caching**:
   - CloudFront for frontend
   - ElastiCache for frequently accessed data
   - API Gateway caching for query endpoints

3. **Database Scaling**:
   - DynamoDB: Auto-scaling or on-demand
   - RDS: Read replicas for read-heavy workloads

## Cost Optimization

1. **Right-sizing**:
   - Monitor resource utilization
   - Adjust Lambda memory/timeout
   - Optimize ECS task sizes

2. **Reserved Capacity**:
   - RDS Reserved Instances (if using RDS)
   - Savings Plans for Lambda/ECS

3. **Storage Lifecycle**:
   - Archive old orders to S3 Glacier
   - TTL on error records

4. **Caching**:
   - Reduce database queries
   - CloudFront caching

## Disaster Recovery

1. **Backup**:
   - DynamoDB: Point-in-time recovery
   - RDS: Automated backups
   - S3: Versioning and cross-region replication

2. **Multi-Region**:
   - Active-passive setup
   - Route 53 health checks for failover

3. **Data Replication**:
   - DynamoDB Global Tables
   - RDS Multi-AZ

## Monitoring & Alerting

### Key Metrics to Monitor
- Order processing rate
- Error rate by partner
- API latency (p50, p95, p99)
- Queue depth
- Database read/write capacity
- Cost per order processed

### Alert Channels
- SNS topics → Email, Slack, PagerDuty
- CloudWatch Alarms → SNS

## Future Enhancements

1. **Real-time Analytics**:
   - Kinesis Analytics for streaming analytics
   - QuickSight dashboards

2. **Machine Learning**:
   - Fraud detection
   - Anomaly detection

3. **Multi-tenancy**:
   - Support for more partners
   - Partner-specific configurations

4. **Event Sourcing**:
   - Store all events as immutable log
   - Replay capability

## Conclusion

This platform is designed to be:
- **Scalable**: Can handle growth from hundreds to millions of orders
- **Reliable**: Idempotent processing, error handling, monitoring
- **Maintainable**: Clear separation of concerns, testable components
- **Cost-effective**: Serverless where possible, right-sized resources
- **Observable**: Comprehensive logging, metrics, and tracing

The architecture can start simple (Lambda + SQS + DynamoDB) and evolve to more complex setups (ECS + Kinesis + RDS) as requirements grow.
