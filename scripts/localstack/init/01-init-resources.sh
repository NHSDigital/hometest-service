#!/bin/bash
# LocalStack initialization script
# This runs automatically when LocalStack starts

set -e

echo "🚀 Initializing LocalStack resources for NHS Home Testing Service..."

# Wait for LocalStack to be ready
echo "⏳ Waiting for LocalStack to be fully ready..."
sleep 5

# Set AWS CLI to use LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=eu-west-2

ENDPOINT="http://localhost:4566"

# ============================================================================
# Create DynamoDB Tables
# ============================================================================
echo "📊 Creating DynamoDB tables..."

# Patient table
awslocal dynamodb create-table \
    --table-name local-nht-patient-db \
    --attribute-definitions AttributeName=nhsNumber,AttributeType=S \
    --key-schema AttributeName=nhsNumber,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "Table local-nht-patient-db already exists"

# Test table
awslocal dynamodb create-table \
    --table-name local-nht-test-db \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=nhsNumber,AttributeType=S \
        AttributeName=step,AttributeType=S \
        AttributeName=bloodTestExpiryWritebackStatus,AttributeType=S \
        AttributeName=expiryStatus,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        "[{\"IndexName\":\"nhsNumberIndex\",\"KeySchema\":[{\"AttributeName\":\"nhsNumber\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},{\"IndexName\":\"stepIndex\",\"KeySchema\":[{\"AttributeName\":\"step\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},{\"IndexName\":\"bloodTestExpiryWritebackStatusStepIndex\",\"KeySchema\":[{\"AttributeName\":\"bloodTestExpiryWritebackStatus\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"step\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},{\"IndexName\":\"expiryStatusStepIndex\",\"KeySchema\":[{\"AttributeName\":\"expiryStatus\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"step\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "Table local-nht-test-db already exists"

# Order table
awslocal dynamodb create-table \
    --table-name local-nht-order-db \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=testId,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        "[{\"IndexName\":\"testIdIndex\",\"KeySchema\":[{\"AttributeName\":\"testId\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "Table local-nht-order-db already exists"

# Lab Result table
awslocal dynamodb create-table \
    --table-name local-nht-lab-result-db \
    --attribute-definitions \
        AttributeName=orderId,AttributeType=S \
        AttributeName=testType,AttributeType=S \
        AttributeName=testId,AttributeType=S \
        AttributeName=patientId,AttributeType=S \
    --key-schema AttributeName=orderId,KeyType=HASH AttributeName=testType,KeyType=RANGE \
    --global-secondary-indexes \
        "[{\"IndexName\":\"testIdIndex\",\"KeySchema\":[{\"AttributeName\":\"testId\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},{\"IndexName\":\"patientIdIndex\",\"KeySchema\":[{\"AttributeName\":\"patientId\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "Table local-nht-lab-result-db already exists"

# Session table
awslocal dynamodb create-table \
    --table-name local-nht-session-db \
    --attribute-definitions AttributeName=sessionId,AttributeType=S \
    --key-schema AttributeName=sessionId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "Table local-nht-session-db already exists"

# Audit Event table
awslocal dynamodb create-table \
    --table-name local-nht-audit-event-db \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=nhsNumber,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        "[{\"IndexName\":\"nhsNumberIndex\",\"KeySchema\":[{\"AttributeName\":\"nhsNumber\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "Table local-nht-audit-event-db already exists"

# GP ODS Code table
awslocal dynamodb create-table \
    --table-name local-nht-gp-ods-code-db \
    --attribute-definitions AttributeName=gpOdsCode,AttributeType=S \
    --key-schema AttributeName=gpOdsCode,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "Table local-nht-gp-ods-code-db already exists"

# SNOMED table
awslocal dynamodb create-table \
    --table-name local-nht-snomed-db \
    --attribute-definitions AttributeName=snomedCode,AttributeType=S \
    --key-schema AttributeName=snomedCode,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "Table local-nht-snomed-db already exists"

# Postcode LSOA mapping table
awslocal dynamodb create-table \
    --table-name local-nht-postcode-lsoa-mapping-db \
    --attribute-definitions AttributeName=postcode,AttributeType=S \
    --key-schema AttributeName=postcode,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "Table local-nht-postcode-lsoa-mapping-db already exists"

# LSOA IMD mapping table
awslocal dynamodb create-table \
    --table-name local-nht-lsoa-imd-mapping-db \
    --attribute-definitions AttributeName=lsoaCode,AttributeType=S \
    --key-schema AttributeName=lsoaCode,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "Table local-nht-lsoa-imd-mapping-db already exists"

# Communication Log table
awslocal dynamodb create-table \
    --table-name local-nht-communication-log-db \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "Table local-nht-communication-log-db already exists"

# Dead Letter Messages table
awslocal dynamodb create-table \
    --table-name local-nht-dead-letter-messages-db \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "Table local-nht-dead-letter-messages-db already exists"

echo "✅ DynamoDB tables created"

# ============================================================================
# Create SQS Queues
# ============================================================================
echo "📨 Creating SQS queues..."

awslocal sqs create-queue --queue-name local-nht-order-queue 2>/dev/null || echo "Queue already exists"
awslocal sqs create-queue --queue-name local-nht-order-dlq 2>/dev/null || echo "Queue already exists"
awslocal sqs create-queue --queue-name local-nht-result-queue 2>/dev/null || echo "Queue already exists"
awslocal sqs create-queue --queue-name local-nht-result-dlq 2>/dev/null || echo "Queue already exists"
awslocal sqs create-queue --queue-name local-nht-event-queue 2>/dev/null || echo "Queue already exists"
awslocal sqs create-queue --queue-name local-nht-event-dlq 2>/dev/null || echo "Queue already exists"
awslocal sqs create-queue --queue-name local-nht-notification-queue 2>/dev/null || echo "Queue already exists"

echo "✅ SQS queues created"

# ============================================================================
# Create S3 Buckets
# ============================================================================
echo "🪣 Creating S3 buckets..."

awslocal s3 mb s3://local-nht-ui-bucket 2>/dev/null || echo "Bucket already exists"
awslocal s3 mb s3://local-nht-data-bucket 2>/dev/null || echo "Bucket already exists"

echo "✅ S3 buckets created"

# ============================================================================
# Create Secrets
# ============================================================================
echo "🔐 Creating secrets..."

awslocal secretsmanager create-secret \
    --name nht/local/test-api-key \
    --secret-string "local-test-api-key-12345" \
    2>/dev/null || echo "Secret already exists"

awslocal secretsmanager create-secret \
    --name nht/local/nhs-login-private-key \
    --secret-string "local-test-private-key" \
    2>/dev/null || echo "Secret already exists"

awslocal secretsmanager create-secret \
    --name nht/local/thriva-api-key \
    --secret-string "local-test-thriva-key" \
    2>/dev/null || echo "Secret already exists"

echo "✅ Secrets created"

# ============================================================================
# Seed Test Data
# ============================================================================
echo "🌱 Seeding test data..."

# Add test GP practices
awslocal dynamodb put-item \
    --table-name local-nht-gp-ods-code-db \
    --item '{"gpOdsCode":{"S":"A12345"},"enabled":{"BOOL":true},"name":{"S":"Test GP Surgery"}}'

awslocal dynamodb put-item \
    --table-name local-nht-gp-ods-code-db \
    --item '{"gpOdsCode":{"S":"B67890"},"enabled":{"BOOL":true},"name":{"S":"Demo Medical Centre"}}'

# Add test patient
awslocal dynamodb put-item \
    --table-name local-nht-patient-db \
    --item '{"nhsNumber":{"S":"9999999999"},"firstName":{"S":"Test"},"lastName":{"S":"User"},"dateOfBirth":{"S":"1990-01-01"},"email":{"S":"test.user@example.com"},"phoneNumber":{"S":"+447123456789"},"gpOdsCode":{"S":"A12345"}}'

# Add postcode mappings
awslocal dynamodb put-item \
    --table-name local-nht-postcode-lsoa-mapping-db \
    --item '{"postcode":{"S":"SW1A1AA"},"lsoaCode":{"S":"E01004736"}}'

# Add LSOA IMD mappings
awslocal dynamodb put-item \
    --table-name local-nht-lsoa-imd-mapping-db \
    --item '{"lsoaCode":{"S":"E01004736"},"imdDecile":{"N":"5"},"imdRank":{"N":"15000"}}'

echo "✅ Test data seeded"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         LocalStack initialization complete!                    ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Endpoint: http://localhost:4566                               ║"
echo "║                                                                ║"
echo "║  Services available:                                           ║"
echo "║    - DynamoDB: http://localhost:4566                           ║"
echo "║    - SQS: http://localhost:4566                                ║"
echo "║    - S3: http://localhost:4566                                 ║"
echo "║    - Secrets Manager: http://localhost:4566                    ║"
echo "║    - Lambda: http://localhost:4566                             ║"
echo "║    - API Gateway: http://localhost:4566                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
