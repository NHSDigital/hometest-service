# Local Development Environment

This directory contains scripts and configuration for running the NHS Home Testing application locally without requiring AWS access.

## Prerequisites

- Node.js 24+ (use `nvm use 24`)
- Docker and Docker Compose
- npm packages installed (`npm run install-all` from root)

## Quick Start

### 1. Start Local Infrastructure

```bash
# From project root
docker-compose -f docker-compose.local.yml up -d
```

This starts:
- **DynamoDB Local** on `http://localhost:8000`
- **DynamoDB Admin UI** on `http://localhost:8001`

### 2. Initialize Database Tables

```bash
npx ts-node scripts/local-dev/init-tables.ts
```

### 3. Seed Test Data (Optional)

```bash
npx ts-node scripts/local-dev/seed-data.ts
```

### 4. Start Local API Gateway

```bash
npx ts-node scripts/local-dev/api-gateway.ts
```

The API gateway runs on `http://localhost:4000` and provides:
- Mock NHS Login endpoints
- Mock backend API endpoints matching nhc-backend-stack
- All endpoints needed for the UI to function

### 5. Start the UI

In a separate terminal:

```bash
cd ui
REACT_APP_AWS_ACCOUNT_NAME=local REACT_APP_ENV=local npm start
```

### 6. Access the Application

Open `https://localhost:3000` in your browser.

## Available Scripts

Add these to your root `package.json`:

```json
{
  "scripts": {
    "local:infra": "docker-compose -f docker-compose.local.yml up -d",
    "local:infra:down": "docker-compose -f docker-compose.local.yml down",
    "local:db:init": "npx ts-node scripts/local-dev/init-tables.ts",
    "local:db:seed": "npx ts-node scripts/local-dev/seed-data.ts",
    "local:api": "npx ts-node scripts/local-dev/api-gateway.ts",
    "local:ui": "cd ui && REACT_APP_AWS_ACCOUNT_NAME=local REACT_APP_ENV=local npm start",
    "local:setup": "npm run local:infra && sleep 5 && npm run local:db:init && npm run local:db:seed"
  }
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Local Environment                         │
├─────────────────────────────────────────────────────────────┤
│  React UI (localhost:3000)                                  │
│       ↓                                                     │
│  Express API Gateway (localhost:4000)                       │
│       ├── /mock/nhs-login/* → Mock NHS Login responses      │
│       ├── /* → Mock backend responses (no /api prefix)      │
│       ↓                                                     │
│  DynamoDB Local (localhost:8000)                            │
│       └── Admin UI (localhost:8001)                         │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/login` | Login callback |
| POST | `/logout` | Logout |
| POST | `/refresh-token` | Refresh token |
| GET | `/patient` | Get patient info |
| POST | `/patient` | Update patient info |
| GET | `/address` | Address lookup |
| POST | `/hometest` | Initiate test |
| GET | `/hometest` | List tests |
| GET | `/hometest/:id` | Get test |
| POST | `/hometest/:id/version` | Version migration |
| POST | `/hometest/:id/schedule-gp-update` | Schedule GP update |
| POST | `/hometest/:id/questionnaire` | Update questionnaire |
| POST | `/hometest/:id/questionnaire/submit` | Submit questionnaire |
| POST | `/hometest/:id/order` | Place test order |
| POST | `/events` | Event audit |
| GET | `/rum-identity` | RUM identity (returns 503 locally) |
| GET | `/.well-known/jwks.json` | JWKS endpoint |
| GET | `/health` | API health check |

## Test User

The seed data creates a test user with:

| Field | Value |
|-------|-------|
| NHS Number | `9999999999` |
| Name | Test User |
| Email | test.user@example.com |
| DOB | 1990-01-01 |
| GP Practice | A12345 |

## DynamoDB Tables

The following tables are created (matching nhc-db-stack):

| Table | Partition Key | Sort Key | GSIs |
|-------|--------------|----------|------|
| nhc-patient-db | nhsNumber | - | - |
| nhc-order-db | id | - | healthCheckIdIndex |
| nhc-health-check-db | id | - | nhsNumberIndex, stepIndex, bloodTestExpiryWritebackStatusStepIndex, expiryStatusStepIndex |
| nhc-lab-result-db | orderId | testType | healthCheckIdIndex, patientIdIndex |
| nhc-audit-event-db | id | - | nhsNumberIndex |
| nhc-ods-code-db | gpOdsCode | - | - |
| nhc-session-db | sessionId | - | - |
| nhc-snomed-db | id | - | - |
| nhc-gp-update-scheduler-db | scheduleId | - | healthCheckIdIndex |
| nhc-postcode-lsoa-db | postcode | - | - |
| nhc-lsoa-imd-db | lsoaCode | - | - |
| nhc-dead-letter-messages-db | id | - | queueNameIndex |
| nhc-communication-log-db | messageReference | - | - |
| nhc-mns-messages-log-db | id | - | - |

## Troubleshooting

### HTTPS / Custom Domain Setup

If you need to test with a custom domain (e.g., `local-api.nhttest.org`), you can enable HTTPS:

#### 1. Generate Self-Signed Certificates

```bash
mkdir -p scripts/local-dev/certs
openssl req -x509 -newkey rsa:4096 \
  -keyout scripts/local-dev/certs/key.pem \
  -out scripts/local-dev/certs/cert.pem \
  -days 365 -nodes \
  -subj "/CN=local-api.nhttest.org"
```

#### 2. Add Custom Domain to /etc/hosts

```bash
echo "127.0.0.1 local-api.nhttest.org" | sudo tee -a /etc/hosts
```

#### 3. Start API Gateway with HTTPS

```bash
HTTPS=true npx ts-node scripts/local-dev/api-gateway.ts
```

This starts both:
- HTTP on port 4000
- HTTPS on port 4443

#### 4. Port Forward (optional)

To access via standard HTTPS port (443):

```bash
# Linux - requires root/sudo
sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 4443

# macOS
echo "rdr pass on lo0 inet proto tcp from any to any port 443 -> 127.0.0.1 port 4443" | sudo pfctl -ef -
```

#### 5. Trust the Certificate

Your browser will show a certificate warning. Either:
- Accept the self-signed certificate in your browser
- Add the certificate to your system's trusted certificates

### DynamoDB Connection Issues

```bash
# Check if containers are running
docker ps

# View container logs
docker logs dhc-dynamodb

# Restart containers
docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml up -d
```

### Port Conflicts

If ports are in use:
- DynamoDB: Change `8000:8000` in docker-compose.local.yml
- DynamoDB Admin: Change `8001:8001` in docker-compose.local.yml
- API Gateway: Change `PORT` in api-gateway.ts
- UI: Uses port 3000 by default (React)

### Reset Local Environment

```bash
# Stop and remove containers + volumes
docker-compose -f docker-compose.local.yml down -v

# Restart fresh
npm run local:setup
```

## Limitations

The local environment has some limitations compared to the full AWS deployment:

1. **No real NHS Login** - Uses mock authentication
2. **No SQS queues** - Events are logged but not queued
3. **No CloudWatch** - Logging is console-only
4. **No S3** - File storage not available
5. **No real external APIs** - Thriva, EMIS, etc. are mocked

This is suitable for:
- Frontend development
- Basic backend logic testing
- UI/UX iterations
- Offline development

For full integration testing, use the AWS `poc` environment.
