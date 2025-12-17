#!/bin/bash
set -e
source ./scripts/protected-envs.sh

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

check_protected_env_deploy "$ENV_NAME"

ENV_NAME=$(echo "$ENV_NAME" | awk '{print tolower($0)}')

# Change current working directory to be the root of project, regardless of how this script is invoked
pushd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

cd infra/main
cdk deploy --all -c awsAccount=$AWS_ACCOUNT_NAME -c environment=$ENV_NAME -c local=true
popd

read -p "Deployment complete. Do you want to start the app? (y/n)" CONTINUE
if [ "$CONTINUE" == "y" ]; then
    cd "$(dirname "${BASH_SOURCE[0]}")"
    ./run-local.sh $AWS_ACCOUNT_NAME $ENV_NAME
else
    echo "Run locally with: './scripts/run-local.sh $AWS_ACCOUNT_NAME $ENV_NAME'"
fi

