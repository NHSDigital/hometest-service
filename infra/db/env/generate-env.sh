#!/bin/bash
set -e
AWS_ACCOUNT_NAME=$1
ENV_NAME=$2

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
    echo "Generating $ENV_NAME environment file in folder $AWS_ACCOUNT_NAME"
    cat .env.template > $AWS_ACCOUNT_NAME/$ENV_NAME.env
popd