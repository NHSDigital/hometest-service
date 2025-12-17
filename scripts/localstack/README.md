# LocalStack Development Environment

This directory contains scripts and configuration for running the NHS Digital Health Checks application using LocalStack - a full AWS cloud emulator.

## Why LocalStack?

LocalStack provides a more realistic AWS environment compared to the basic local setup:

| Feature | Basic Local | LocalStack |
|---------|-------------|------------|
| DynamoDB | ✅ DynamoDB Local | ✅ Full emulation |
| Lambda | ❌ Express mocks | ✅ Real Lambda execution |
| API Gateway | ❌ Express proxy | ✅ Full API Gateway |
| SQS Queues | ❌ Not available | ✅ Full emulation |
| S3 | ❌ Not available | ✅ Full emulation |
| Secrets Manager | ❌ Not available | ✅ Full emulation |
| CDK Deployment | ❌ Not supported | ✅ Via cdklocal |
| CloudWatch | ❌ Console only | ✅ Full emulation |

## Prerequisites

- Docker and Docker Compose
- Node.js 24+ (use `nvm use 24`)
- npm packages installed (`npm run install-all`)
- ~4GB RAM available for LocalStack

## Quick Start

### Option 1: Basic Resources (No CDK)

This creates DynamoDB tables, SQS queues, S3 buckets, and secrets without deploying Lambda functions:

```bash
# Start LocalStack
npm run localstack:start

# Resources are auto-initialized via init script
# Wait ~30 seconds for initialization

# Start the UI with basic local API
npm run local:api &  # In background
npm run localstack:ui
```

### Option 2: Full CDK Deployment (Recommended)

This deploys actual CDK stacks including Lambda functions:

```bash
# Start LocalStack
npm run localstack:start

# Wait for LocalStack to be ready (~30 seconds)
npm run localstack:wait

# Deploy all CDK stacks
npm run localstack:deploy

# Generate UI environment from stack outputs
npm run localstack:env

# Start the UI
npm run localstack:ui
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run localstack:start` | Start LocalStack container |
| `npm run localstack:stop` | Stop LocalStack container |
| `npm run localstack:logs` | View LocalStack logs |
| `npm run localstack:wait` | Wait for LocalStack to be ready |
| `npm run localstack:deploy` | Deploy CDK stacks to LocalStack |
| `npm run localstack:env` | Generate UI env file from outputs |
| `npm run localstack:ui` | Start UI pointing to LocalStack |
| `npm run localstack:reset` | Reset LocalStack (delete all data) |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LocalStack Container                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    API Gateway                             │  │
│  │     /api/*  →  Backend Lambdas                            │  │
│  │     /mock/* →  Mock Lambdas (NHS Login, Thriva, etc.)     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Lambda    │  │   Lambda    │  │   Lambda    │             │
│  │   login     │  │  health-    │  │   order     │  ...        │
│  │             │  │   check     │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         ↓                ↓                ↓                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DynamoDB  │  SQS Queues  │  S3  │  Secrets Manager     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                    React UI (localhost:3000)
```

## Useful Commands

### AWS CLI with LocalStack

```bash
# List DynamoDB tables
awslocal dynamodb list-tables

# Scan a table
awslocal dynamodb scan --table-name local-nhc-patient-db

# List SQS queues
awslocal sqs list-queues

# List S3 buckets
awslocal s3 ls

# Get a secret
awslocal secretsmanager get-secret-value --secret-id nhc/local/qcalc-api-key

# List Lambda functions
awslocal lambda list-functions

# Invoke a Lambda
awslocal lambda invoke --function-name local-login-lambda output.json
```

### Debugging

```bash
# View LocalStack logs
docker logs -f dhc-localstack

# Check LocalStack health
curl http://localhost:4566/_localstack/health | jq

# Check specific service
curl http://localhost:4566/_localstack/health | jq '.services.dynamodb'
```

## Test User

The initialization script creates a test user:

| Field | Value |
|-------|-------|
| NHS Number | `9999999999` |
| Name | Test User |
| Email | test.user@example.com |
| DOB | 1990-01-01 |
| GP Practice | A12345 |

## Troubleshooting

### LocalStack won't start

```bash
# Check Docker is running
docker ps

# Check for port conflicts
lsof -i :4566

# Reset and restart
npm run localstack:reset
npm run localstack:start
```

### Lambda functions not working

```bash
# Check Lambda executor mode
docker logs dhc-localstack | grep LAMBDA

# Ensure Docker socket is mounted
docker inspect dhc-localstack | grep -A5 Mounts
```

### CDK deployment fails

```bash
# Bootstrap CDK first
cdklocal bootstrap --context environment=local

# Check if awslocal works
awslocal sts get-caller-identity
```

### Out of memory

LocalStack can be memory-intensive. Try:

```bash
# Increase Docker memory limit to 4GB+
# Or disable some services in docker-compose.localstack.yml
SERVICES=dynamodb,lambda,apigateway,sqs
```

## Comparison with Basic Local Setup

| Scenario | Use Basic Local | Use LocalStack |
|----------|-----------------|----------------|
| Quick UI changes | ✅ | |
| Lambda code testing | | ✅ |
| SQS workflow testing | | ✅ |
| Integration tests | | ✅ |
| Low-resource machine | ✅ | |
| CDK validation | | ✅ |
| Offline development | ✅ | ✅ |

## Resource Usage

- **Basic Local**: ~200MB RAM
- **LocalStack**: ~2-4GB RAM (depends on services used)
- **LocalStack with Lambdas**: ~4-6GB RAM
