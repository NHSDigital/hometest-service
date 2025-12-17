#!/bin/bash

AWS_ACCOUNT_NAME=$1
ENV_NAME=$2

if [[ -z $AWS_ACCOUNT_NAME ]]; then
    echo "please provide the name of the AWS account as parameter"
    exit
fi

if [ -z "$ENV_NAME" ]
    then
        echo "please provide the name of the environment as parameter"
        exit
    fi

AWS_ACCOUNT_NAME=$(echo $AWS_ACCOUNT_NAME | awk '{print tolower($0)}')
ENV_NAME=$(echo $ENV_NAME | awk '{print tolower($0)}')

pushd "$(dirname ${BASH_SOURCE[0]})"
    ./../../infra/main/env/generate-env.sh  "$AWS_ACCOUNT_NAME" "$ENV_NAME"
    ./../../infra/db/env/generate-env.sh "$AWS_ACCOUNT_NAME" "$ENV_NAME"
    ./../../ui/env/generate-env.sh  "$AWS_ACCOUNT_NAME" "$ENV_NAME"
popd