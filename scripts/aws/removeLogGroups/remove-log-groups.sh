#!/bin/bash
set -e

function removeLogGroups {
    logGroups=$(aws logs describe-log-groups --log-group-name-pattern "$1" --query='logGroups[*].logGroupName' | jq -r '.[]')
    echo "Log groups to be deleted:"
    echo "$logGroups"

    if [ ! -z "$logGroups" ]; then
        for logGroup in $logGroups; do
            aws logs delete-log-group --log-group-name=$logGroup
        done
        echo "Log groups deleted"
    fi
}

function removeAllLogGroups {
    removeLogGroups "$ENV_NAME"
}

function removeLambdaLogGroups {
    removeLogGroups "/aws/lambda/$ENV_NAME" 
}