#!/bin/bash
set -e

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

AWS_ACCOUNT_NAME=$(echo $AWS_ACCOUNT_NAME | awk '{print tolower($0)}')
ENV_NAME=$(echo $ENV_NAME | awk '{print tolower($0)}')


# Change current working directory to be the root of project, regardless of how this script is invoked
pushd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1
cd ui

REACT_APP_AWS_ACCOUNT_NAME=$AWS_ACCOUNT_NAME REACT_APP_ENV=$ENV_NAME npm run start

popd
