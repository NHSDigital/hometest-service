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

for dir in /lambdas/*; do
  if [ -d "$dir" ]; then
    LAMBDA_NAME=$(basename "$dir")
    zip_file="/tmp/${LAMBDA_NAME}.zip"

    # Create deployment package
    (cd "$dir" && zip -r "$zip_file" .)

    # Create or update the Lambda function
    if aws lambda get-function --function-name "$LAMBDA_NAME" --endpoint-url $ENDPOINT_URL > /dev/null 2>&1; then
      echo "Updating existing Lambda function: $LAMBDA_NAME"
      aws lambda update-function-code \
        --function-name "$LAMBDA_NAME" \
        --zip-file "fileb://$zip_file" \
        --endpoint-url $ENDPOINT_URL \
        > /dev/null
    else
      echo "Creating new Lambda function: $LAMBDA_NAME"
      aws lambda create-function \
        --function-name "$LAMBDA_NAME" \
        --runtime nodejs24.x \
        --role "$ROLE_ARN" \
        --handler "index.handler" \
        --zip-file "fileb://$zip_file" \
        --endpoint-url $ENDPOINT_URL \
        > /dev/null
    fi

    rm "$zip_file"
  fi
done

echo "All Lambda functions have been deployed."
