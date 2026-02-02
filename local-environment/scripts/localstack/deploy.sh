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

for file in "$SECRETS_DIR"/*.json; do
  [ -e "$file" ] || continue

  secret_name=$(basename "$file" .json)

  echo "Processing secret: $secret_name"

  if awslocal secretsmanager describe-secret --secret-id "$secret_name" >/dev/null 2>&1; then
    echo "Updating existing secret ($secret_name)"
    awslocal secretsmanager update-secret \
      --secret-id "$secret_name" \
      --secret-string "file://$file"
  else
    echo "Creating new secret ($secret_name)"
    awslocal secretsmanager create-secret \
      --name "$secret_name" \
      --secret-string "file://$file"
  fi
done

echo "All secrets created."
