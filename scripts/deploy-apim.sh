#!/bin/bash
set -e

ENV_NAME=$1
INSTANCE_NAME=$2
IS_PROD=$3

if [ -z "$ENV_NAME" ]; then
    echo "please provide the name of the env"
    echo "Must be one of {internal-dev|internal-dev-sandbox|internal-qa|internal-qa-sandbox|ref|dev|int|sandbox|prod}"
    exit
fi

if [ -z "$INSTANCE_NAME" ]; then
    echo "please provide the name of the instance as parameter"
    exit
fi

# Bundle the spec with all $ref resolved except url refs (for securitySchema)
npx @redocly/cli@1.34.0 bundle ./apim/api/home-testing-results-spec.yaml -k -o bundled-spec.yaml

# Merge general api and env-specific instance specs
cat bundled-spec.yaml ./apim/instances/${ENV_NAME}.yaml > spec.yaml

if [[ $IS_PROD == "prod" ]]; then
  PUBLISH_COMMAND="proxygen spec publish"
else
  PUBLISH_COMMAND="proxygen spec publish --uat"
fi

# Deploy spec to instance
echo "Deploying to instance"
if [[ $CI  == true ]]; then
  echo "Running in CI"
  proxygen instance deploy ${ENV_NAME} ${INSTANCE_NAME} spec.yaml --no-confirm
else
  proxygen instance deploy ${ENV_NAME} ${INSTANCE_NAME} spec.yaml
fi
echo "Done deploying to instance"

# Deploy spec to docs
echo "Deploying to docs"
if [[ $CI  == true ]]; then
  echo "Running in CI"
  ${PUBLISH_COMMAND} spec.yaml --no-confirm
else
  ${PUBLISH_COMMAND} spec.yaml
fi
echo "Done deploying to docs"

rm -rf bundled-spec.yaml spec.yaml