#!/bin/bash
set -e

ENDPOINT_URL="http://localhost:4566"
ROLE_ARN="arn:aws:iam::000000000000:role/lambda-exec"

export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test"
export AWS_DEFAULT_REGION="eu-west-1"

# Ensure IAM role exists
aws iam create-role \
  --role-name lambda-exec \
  --assume-role-policy-document file://scripts/localstack/lambda-trust-policy.json \
  --endpoint-url $ENDPOINT_URL \
  > /dev/null 2>&1 || true

echo "IAM role created."
