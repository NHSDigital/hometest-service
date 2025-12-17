#!/bin/bash
# Wait for LocalStack to be ready
# Usage: ./scripts/localstack/wait-for-localstack.sh

set -e

MAX_RETRIES=30
RETRY_INTERVAL=2

echo "⏳ Waiting for LocalStack to be ready..."

for i in $(seq 1 $MAX_RETRIES); do
    if curl -s http://localhost:4566/_localstack/health | grep -q '"dynamodb": "running"'; then
        echo "✅ LocalStack is ready!"
        exit 0
    fi
    echo "   Attempt $i/$MAX_RETRIES - LocalStack not ready yet..."
    sleep $RETRY_INTERVAL
done

echo "❌ LocalStack did not become ready in time"
exit 1
