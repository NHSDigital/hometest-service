#!/bin/bash

source ./scripts/protected-envs.sh

function deploySavedQueries() {
    pushd "$(dirname ${BASH_SOURCE[0]})"
       cd ../saved-queries
       node deploySavedQueries.js $ENV_NAME <<< "y"
    popd
}

function populateDatabase() {
    pushd "$(dirname ${BASH_SOURCE[0]})"
       cd ../db
       ./runDataLoad.sh $ENV_NAME
    popd
}

function createPostmanEnvFile() {
    pushd "$(dirname ${BASH_SOURCE[0]})"
        cd ../postman
        ./generatePostmanEnvFile.sh $ENV_NAME
    popd
}

function cloudfrontKVStore() {
    pushd "$(dirname ${BASH_SOURCE[0]})"
        cd ../aws
        ./setIsServiceDownKV.sh $ENV_NAME "false"
    popd
}

function createAthenaViews() {
    pushd "$(dirname ${BASH_SOURCE[0]})"
        cd ../aws
        ./athena-views-setup.sh $ENV_NAME $AWS_ACCOUNT_NAME
    popd
}

ENV_NAME=$1
AWS_ACCOUNT_NAME=$2
if [ -z "$ENV_NAME" ]
then
    echo "please provide the name of the environment as parameter"
    exit
fi

if [ -z "$AWS_ACCOUNT_NAME" ]
then
    AWS_ACCOUNT_NAME="poc"
fi

check_protected_env_deploy "$ENV_NAME"
ENV_NAME=$(echo $ENV_NAME | awk '{print tolower($0)}')

deploySavedQueries
populateDatabase
createPostmanEnvFile
cloudfrontKVStore
createAthenaViews
