#!/bin/bash
set -ex
SCRIPT_DIR=$(dirname "$0")

ENDPOINT_URL="http://localstack:4566"
ROLE_ARN="arn:aws:iam::000000000000:role/lambda-exec"

export AWS_ACCESS_KEY_ID="test"
export AWS_SECRET_ACCESS_KEY="test"
export AWS_DEFAULT_REGION="eu-west-1"

# Ensure IAM role exists
if ! aws iam get-role --role-name lambda-exec --endpoint-url $ENDPOINT_URL > /dev/null 2>&1; then
  aws iam create-role \
    --role-name lambda-exec \
    --assume-role-policy-document file:///etc/scripts/lambda-trust-policy.json \
    --endpoint-url $ENDPOINT_URL \
    > /dev/null
fi

echo "IAM role created."
