#!/bin/bash
set -e

source $(dirname "${BASH_SOURCE[0]}")/../../../scripts/aws/functions.sh

AWS_ACCOUNT_NAME=$1
ENV_NAME=$2
DB_ENV_NAME=$ENV_NAME # TODO: revisit for blue/green deployment

STACK_OUTPUT=$(fetchStackOutputValue $ENV_NAME-nhc-mocks-stack $ENV_NAME"MockApiBaseUrl")
MOCK_API_URL=$(echo $STACK_OUTPUT | sed 's/\/$//')

if [[ -z $AWS_ACCOUNT_NAME ]]; then
    echo "please provide the name of the AWS account as parameter"
    exit
fi

if [[ -z $ENV_NAME ]]; then
    echo "please provide the name of the environment as parameter"
    exit
fi
ENV_NAME=$(echo $ENV_NAME | awk '{print tolower($0)}')

# Change current working directory to be the root of project, regardless of how this script is invoked
pushd "$(dirname "${BASH_SOURCE[0]}")" || exit 1
    pwd
    echo "Generating $ENV_NAME environment file in folder $AWS_ACCOUNT_NAME"
    cat .env.template | sed -e "s@PUT_YOUR_ENVIRONMENT_NAME_HERE@$ENV_NAME@g" \
    -e "s@PUT_YOUR_DB_ENVIRONMENT_NAME_HERE@$DB_ENV_NAME@" \
    > $AWS_ACCOUNT_NAME/$ENV_NAME.env
popd