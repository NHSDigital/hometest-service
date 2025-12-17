#!/bin/bash
set -e
source ./scripts/protected-envs.sh

ENV_NAME=$1

if [ -z "$ENV_NAME" ]
then
    echo "please provide the name of the environment as parameter"
    exit
fi

check_protected_env_deploy "$ENV_NAME"