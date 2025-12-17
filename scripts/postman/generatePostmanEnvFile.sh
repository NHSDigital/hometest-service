#!/bin/bash

function fetchStackOutputValue() {
    local STACK_NAME=$1
    local OUTPUT_NAME=$2

    OUTPUT_VALUE=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='$OUTPUT_NAME'].OutputValue" --output text)
    echo "$OUTPUT_VALUE"
}

function createPostmanEnvFile() {
    local ENV_DISPLAY_NAME="NHS DHC $ENV_NAME"
    local ENV_UUID=$(uuidgen)

    local BACKEND_API_URL
    if [ -z "$AWS_BACKEND_API_DOMAIN_NAME" ]; then
        BACKEND_API_URL=$(fetchStackOutputValue "${ENV_NAME}-nhc-backend-stack" "${ENV_NAME}HealthCheckApiBaseUrl")
    else
        BACKEND_API_URL="https://$AWS_BACKEND_API_DOMAIN_NAME"
    fi

    local RESULT_API_URL
    if [ -z "$AWS_RESULTS_API_DOMAIN_NAME" ]; then
        RESULT_API_URL=$(fetchStackOutputValue "${ENV_NAME}-nhc-result-stack" "${ENV_NAME}ResultApiBaseUrl")
    else
        RESULT_API_URL="https://$AWS_RESULTS_API_DOMAIN_NAME"
    fi

    local MTLS_RESULTS_API_URL="https://mtls-$AWS_RESULTS_API_DOMAIN_NAME"

    local CALLBACK_API_URL
    if [ -z "$AWS_CALLBACK_API_DOMAIN_NAME" ]; then
        CALLBACK_API_URL=$(fetchStackOutputValue "${ENV_NAME}-nhc-backend-stack" "${ENV_NAME}CallbacksApiBaseUrl")
    else
        CALLBACK_API_URL="https://$AWS_CALLBACK_API_DOMAIN_NAME"
    fi
    local RESULTS_COGNITO_AUTH_URL=$(fetchStackOutputValue $ENV_NAME-nhc-result-stack "${ENV_NAME}ResultsCognitoUrl")
    local RESULTS_COGNITO_THRIVA_CLIENT_ID=$(fetchSecretValue "nhc/$ENV_NAME/results-cognito-client-id")
    local RESULTS_COGNITO_THRIVA_CLIENT_SECRET=$(fetchSecretValue "nhc/$ENV_NAME/results-cognito-client-secret")
    local MOCK_API_URL="https://${ENV_NAME}-mock-api.dhctest.org"

    pushd "$(dirname ${BASH_SOURCE[0]})"
    cd ../../integration-utils/postman/NHC\ Health\ Checks/
    mkdir -p "environments"
    cat template.postman_environment.json | \

    sed -e "s~BACKEND_API_URL~$BACKEND_API_URL~" \
        -e "s~MOCK_API_URL~$MOCK_API_URL~" \
        -e "s~RESULT_API_URL~$RESULT_API_URL~" \
        -e "s~MTLS_RESULTS_API_URL~$MTLS_RESULTS_API_URL~" \
        -e "s~CALLBACK_API_URL~$CALLBACK_API_URL~" \
        -e "s~RESULTS_COGNITO_AUTH_URL~$RESULTS_COGNITO_AUTH_URL~" \
        -e "s~RESULTS_COGNITO_THRIVA_CLIENT_ID~$RESULTS_COGNITO_THRIVA_CLIENT_ID~" \
        -e "s~RESULTS_COGNITO_THRIVA_CLIENT_SECRET~$RESULTS_COGNITO_THRIVA_CLIENT_SECRET~" \
        -e "s/ENV_UUID/$ENV_UUID/" \
        -e "s/ENV_DISPLAY_NAME/$ENV_DISPLAY_NAME/" \
        template.postman_environment.json > "environments/${ENV_DISPLAY_NAME}.postman_environment.json"
    popd
}

AWS_ACCOUNT_NAME=$1
ENV_NAME=$2

if [ -z "$AWS_ACCOUNT_NAME" ]; then
    echo "please provide the name of the AWS account as parameter"
    exit
fi

if [ -z "$ENV_NAME" ]; then
    echo "please provide the name of the environment as parameter"
    exit
fi

ENV_NAME=$(echo $ENV_NAME | awk '{print tolower($0)}')
AWS_ACCOUNT_NAME=$(echo $AWS_ACCOUNT_NAME | awk '{print tolower($0)}')

source "$(dirname "${BASH_SOURCE[0]}")/../../infra/main/env/${AWS_ACCOUNT_NAME}/${ENV_NAME}.env"

createPostmanEnvFile