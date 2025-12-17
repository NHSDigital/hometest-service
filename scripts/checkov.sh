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

AWS_ACCOUNT_NAME=$(echo "$AWS_ACCOUNT_NAME" | awk '{print tolower($0)}')
ENV_NAME=$(echo "$ENV_NAME" | awk '{print tolower($0)}')

# Change current working directory to be the root of project, regardless of how this script is invoked
pushd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1
rm -rf checkov-temp
mkdir checkov-temp
mkdir -p checkov-temp/results
cd ui
if [ "$IS_RUN_FROM_PIPELINE" == "true" ]; then
  mkdir build
else
  REACT_APP_AWS_ACCOUNT_NAME=$AWS_ACCOUNT_NAME REACT_APP_ENV=$ENV_NAME npm run build
fi
 
cd ../infra/shared
cdk synth --all --concurrency 3 --asset-parallelism true -c awsAccount=$AWS_ACCOUNT_NAME > /dev/null
cp cdk.out/*.template.json ../../checkov-temp/

cd ../security
cdk synth --all --concurrency 3 --asset-parallelism true -c environment=Security -c envType=${ENV_NAME} > /dev/null
cp cdk.out/*.template.json ../../checkov-temp/

cd ../dev
cdk synth --all --concurrency 3 --asset-parallelism true -c awsAccount=$AWS_ACCOUNT_NAME -c environment=$ENV_NAME > /dev/null
cp cdk.out/*.template.json ../../checkov-temp/

cd ../db
cdk synth --all --concurrency 3 --asset-parallelism true -c awsAccount=$AWS_ACCOUNT_NAME -c environment=$ENV_NAME > /dev/null
cp cdk.out/*.template.json ../../checkov-temp/

cd ../main
cdk synth --all --concurrency 3 --asset-parallelism true -c awsAccount=$AWS_ACCOUNT_NAME -c environment=$ENV_NAME > /dev/null
cp cdk.out/*.template.json ../../checkov-temp/

if [ "$IS_RUN_FROM_PIPELINE" != "true" ]; then
  cd ../../checkov-temp/
  checkov --directory . --quiet -o cli -csv --output-file-path ../checkov-temp/results/.
  echo "checkov complete."
fi
