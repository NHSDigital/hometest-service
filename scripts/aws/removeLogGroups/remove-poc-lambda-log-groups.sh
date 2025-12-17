#!/bin/bash
set -e
source ./scripts/protected-envs.sh
source ./scripts/aws/removeLogGroups/remove-log-groups.sh
# when this script is ran you need to run pre deploy to re create the mock log groups
ENV_NAME=$1

if [ -z "$ENV_NAME" ]
then
    echo "please provide the name of the environment you want to remove as parameter, only use this for POC accounts"
    exit
fi

check_protected_env_destroy "$ENV_NAME"

ENV_NAME=$(echo $ENV_NAME | awk '{print tolower($0)}')

removeLambdaLogGroups

echo "Environment log groups destroy complete."


