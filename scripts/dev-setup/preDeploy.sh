#!/bin/bash
source $(dirname "${BASH_SOURCE[0]}")/../aws/functions.sh
source ./scripts/protected-envs.sh

function deployMockStack() {    
    pushd "$(dirname ${BASH_SOURCE[0]})"
       cd ../../infra/dev
       cdk deploy --all -c awsAccount=$AWS_ACCOUNT_NAME -c environment=$ENV_NAME --require-approval never
       MOCK_STACK_URL=$(fetchStackOutputValue $ENV_NAME-nhc-mocks-stack $ENV_NAME"MockApiBaseUrl")
       echo "Mock stack deployed at $MOCK_STACK_URL"
    popd  
}

function deployInfraDbStack() {
    pushd "$(dirname ${BASH_SOURCE[0]})"
       cd ../../infra/db
       cdk deploy --all -c awsAccount=$AWS_ACCOUNT_NAME -c environment=$ENV_NAME --require-approval never
       echo "Infra/DB stack deployed"
    popd
}

function deployMonitoringStackOnly() {
    pushd "$(dirname ${BASH_SOURCE[0]})"
       cd ../../infra/main
       cdk deploy $ENV_NAME-nhc-monitoring-stack -c awsAccount=$AWS_ACCOUNT_NAME -c environment=$ENV_NAME --exclusively --require-approval never
       echo "Monitoring stack deployed"
    popd
}

function generateEnvFiles() {
    pushd "$(dirname ${BASH_SOURCE[0]})"
       ./generateEnvFiles.sh $AWS_ACCOUNT_NAME $ENV_NAME
    popd
}

function createGlobalConfiguration() {
    pushd "$(dirname ${BASH_SOURCE[0]})"
        cd ../aws
        ./createGlobalConfiguration.sh $AWS_ACCOUNT_NAME $ENV_NAME
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
    
check_protected_env_deploy "$ENV_NAME"
AWS_ACCOUNT_NAME=$(echo $AWS_ACCOUNT_NAME | awk '{print tolower($0)}')
ENV_NAME=$(echo $ENV_NAME | awk '{print tolower($0)}')


deployMockStack
deployInfraDbStack
deployMonitoringStackOnly 
generateEnvFiles
createGlobalConfiguration