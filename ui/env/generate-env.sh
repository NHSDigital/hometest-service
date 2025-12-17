#!/bin/bash
set -e

source $(dirname "${BASH_SOURCE[0]}")/../../scripts/aws/functions.sh

AWS_ACCOUNT_NAME=$1
ENV_NAME=$2

APP_MONITOR_ID=$(fetchStackOutputValue $ENV_NAME-nhc-monitoring-stack $ENV_NAME"AppMonitorId")
MOCK_STACK_OUTPUT=$(fetchStackOutputValue $ENV_NAME-nhc-mocks-stack $ENV_NAME"MockApiBaseUrl")
MOCK_API_URL=$(echo $MOCK_STACK_OUTPUT | sed 's/\/$//')

if [[ -z $AWS_ACCOUNT_NAME ]]; then
    echo "please provide the name of the AWS account as parameter"
    exit
fi

if [[ -z $ENV_NAME ]]; then
    echo "please provide the name of the environment as parameter"
    exit
fi

AWS_ACCOUNT_NAME=$(echo $AWS_ACCOUNT_NAME | awk '{print tolower($0)}')
ENV_NAME=$(echo $ENV_NAME | awk '{print tolower($0)}')

# Change current working directory to be the root of project, regardless of how this script is invoked
pushd "$(dirname "${BASH_SOURCE[0]}")" || exit 1
    pwd
    echo "Generating $ENV_NAME environment file in folder $AWS_ACCOUNT_NAME"
    cat .env.template | sed -e "s@PUT_YOUR_ENVIRONMENT_NAME_HERE@$ENV_NAME@g" \
    -e "s@PUT_APP_MONITOR_ID_HERE@$APP_MONITOR_ID@" \
    > $AWS_ACCOUNT_NAME/$ENV_NAME.env
popd