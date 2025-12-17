#!/bin/bash
# Deploy CDK stacks to LocalStack
# Usage: ./scripts/localstack/deploy-local.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Deploying to LocalStack..."

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
    echo "❌ LocalStack is not running. Start it with:"
    echo "   docker-compose -f docker-compose.localstack.yml up -d"
    exit 1
fi

echo "✅ LocalStack is running"

# Set environment variables for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=eu-west-2
export CDK_DEFAULT_ACCOUNT=000000000000
export CDK_DEFAULT_REGION=eu-west-2

# Check if cdklocal is installed
if ! command -v cdklocal &> /dev/null; then
    echo "📦 Installing aws-cdk-local..."
    npm install -g aws-cdk-local aws-cdk
fi

cd "$PROJECT_ROOT"

# Build the project first
echo "🔨 Building project..."
npm run build

# Bootstrap CDK for LocalStack (first time only)
echo "🏗️ Bootstrapping CDK..."
cdklocal bootstrap --context environment=local --context awsAccount=local 2>/dev/null || true

# Deploy the DB stack first
echo "📊 Deploying DB stack..."
cd "$PROJECT_ROOT/infra/db"
cdklocal deploy --all \
    --context environment=local \
    --context awsAccount=local \
    --require-approval never \
    --outputs-file "$PROJECT_ROOT/scripts/localstack/outputs/db-outputs.json"

# Deploy the Dev (mocks) stack
echo "🎭 Deploying Mocks stack..."
cd "$PROJECT_ROOT/infra/dev"
cdklocal deploy --all \
    --context environment=local \
    --context awsAccount=local \
    --require-approval never \
    --outputs-file "$PROJECT_ROOT/scripts/localstack/outputs/dev-outputs.json"

# Deploy the Main stack
echo "🏢 Deploying Main stack..."
cd "$PROJECT_ROOT/infra/main"
cdklocal deploy --all \
    --context environment=local \
    --context awsAccount=local \
    --require-approval never \
    --outputs-file "$PROJECT_ROOT/scripts/localstack/outputs/main-outputs.json"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              CDK Deployment to LocalStack Complete!            ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Stack outputs saved to: scripts/localstack/outputs/           ║"
echo "║                                                                ║"
echo "║  Next steps:                                                   ║"
echo "║    1. Generate UI env file:                                    ║"
echo "║       npm run localstack:env                                   ║"
echo "║    2. Start the UI:                                            ║"
echo "║       npm run localstack:ui                                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
