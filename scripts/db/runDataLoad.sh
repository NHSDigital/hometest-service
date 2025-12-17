#!/bin/bash
# Script to optionally sync data to S3 and invoke the Lambda function for data loading
# Usage: ./runDataLoad.sh <ENV_NAME> <SYNC>
# Example:  ./runDataLoad.sh demo sync  - with sync
# Example:  ./runDataLoad.sh demo       - without sync

function invokeLambda() {
    local ENV_NAME=$1
    if [ -z "$ENV_NAME" ]
    then
      echo "please provide the name of the environment as parameter"
      exit
    fi
    LAMBDA_NAME="${ENV_NAME}NhcDbDataLoadLambda"
    echo "About to invoke lambda "$LAMBDA_NAME

    aws lambda invoke --function-name $LAMBDA_NAME outfile.txt
    rm outfile.txt
}

function forceMockUserDataReload() {
    local ENV_NAME=$1
    local ACCOUNT_ID=$2
    local ACCOUNT_NAME=$3
    if [ -z "$ACCOUNT_ID" ]; then
      echo "Error: ACCOUNT_ID must be provided as a parameter."
      exit 1
    fi
    local DYNAMODB_DATA_BUCKET_NAME="${ACCOUNT_ID}-${ENV_NAME}-nhc-db-data-load-bucket"
    local DYNAMODB_LOCAL_DATA_DIR="data/db/nonprod"
    echo "Syncing local data from $DYNAMODB_LOCAL_DATA_DIR to s3://$DYNAMODB_DATA_BUCKET_NAME ..."
    aws s3 sync "$DYNAMODB_LOCAL_DATA_DIR" "s3://$DYNAMODB_DATA_BUCKET_NAME" --delete
    echo
    
    // required to force the test scenario page lambda to cold start and pick up new scenarios
    local SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
    echo "Deploying mock stack to reload mock user data..."
    pushd "$PROJECT_ROOT/infra/dev"
    cdk deploy ${ENV_NAME}-nhc-mocks-stack --context environment=${ENV_NAME} --context awsAccount=${ACCOUNT_NAME} --require-approval never
    popd
}

ENV_NAME=$(echo $1 | awk '{print tolower($0)}')
PERFORM_SYNC=$2

# to be used only on POC account for mock user testing
if [ "$PERFORM_SYNC" = "sync" ]; then
  POC_ACCOUNT_ID=880521146064
  AWS_ACCOUNT_NAME="poc"
  forceMockUserDataReload $ENV_NAME $POC_ACCOUNT_ID $AWS_ACCOUNT_NAME
fi

invokeLambda $ENV_NAME