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

AWS_ACCOUNT_NAME=$(echo "$AWS_ACCOUNT_NAME" | awk '{print tolower($0)}')
ENV_NAME=$(echo "$ENV_NAME" | awk '{print tolower($0)}')

echo "Deploying to AWS Account: $AWS_ACCOUNT_NAME"
 
# Change current working directory to be the root of project, regardless of how this script is invoked
pushd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1
cd ui
REACT_APP_AWS_ACCOUNT_NAME=$AWS_ACCOUNT_NAME REACT_APP_ENV=$ENV_NAME npm run build

cd ../data/mocks-generator
npm run generate-mock-data
cd ../../
pwd

cd infra/dev
cdk deploy --all --concurrency 3 --asset-parallelism true -c awsAccount=$AWS_ACCOUNT_NAME -c environment=$ENV_NAME --require-approval never
# If the environment is 'local', deploy the local infra
cd ../db
cdk deploy --all --concurrency 3 --asset-parallelism true -c awsAccount=$AWS_ACCOUNT_NAME -c environment=$ENV_NAME --require-approval never

cd ../main
cdk deploy --all --concurrency 3 --asset-parallelism true -c awsAccount=$AWS_ACCOUNT_NAME -c environment=$ENV_NAME --require-approval never

echo "Deployment complete."

popd
