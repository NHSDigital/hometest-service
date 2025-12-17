#!/bin/bash
set -e
source ./scripts/protected-envs.sh
source ./scripts/aws/removeLogGroups/remove-log-groups.sh

ENV_NAME=$1
AWS_ACCOUNT_NAME=$2

if [ -z "$ENV_NAME" ]
then
    echo "please provide the name of the environment you want to remove as parameter"
    exit
fi

if [ -z "$AWS_ACCOUNT_NAME" ]; then
    echo "please provide the name of the AWS account as parameter"
    exit
fi

check_protected_env_destroy "$ENV_NAME"

ENV_NAME=$(echo $ENV_NAME | awk '{print tolower($0)}')
AWS_ACCOUNT_NAME=$(echo "$AWS_ACCOUNT_NAME" | awk '{print tolower($0)}')

echo "Deploying to AWS Account: $AWS_ACCOUNT_NAME"

function removeSavedQueries {
    existingQueries=$(aws logs describe-query-definitions --query-definition-name-prefix $ENV_NAME | jq '.[][] | .queryDefinitionId' | tr -d '"')
    echo "Saved queries to be removed:"
    echo $existingQueries

    if [[ ! -z "$existingQueries" ]]; then
        for queryDefinitionId in $existingQueries; do
            aws logs delete-query-definition --query-definition-id=$queryDefinitionId --no-cli-pager
        done
        echo "Saved queries deleted"
    fi
}

function scheduleSecretsDeletion {
    echo "Scheduling secrets for deletion"
    aws secretsmanager delete-secret --secret-id=nhc/${ENV_NAME}/nhs-api-key --recovery-window-in-days=7 --no-cli-pager || echo "nhc/${ENV_NAME}/nhs-api-key secret doesn't exist"
    aws secretsmanager delete-secret --secret-id=nhc/${ENV_NAME}/qcalc-api-key --recovery-window-in-days=7 --no-cli-pager || echo "nhc/${ENV_NAME}/qcalc-api-key secret doesn't exist"
}

# Change current working directory to be the root of project, regardless of how this script is invoked
pushd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

cd infra/main
cdk destroy $ENV_NAME-nhc-monitoring-stack -c awsAccount=$AWS_ACCOUNT_NAME -c environment=$ENV_NAME --force
cdk destroy --all -c awsAccount=$AWS_ACCOUNT_NAME -c environment=$ENV_NAME --force

cd ../db
cdk destroy --all -c awsAccount=$AWS_ACCOUNT_NAME -c environment=$ENV_NAME --force

cd ../dev
cdk destroy --all -c awsAccount=$AWS_ACCOUNT_NAME -c environment=$ENV_NAME --force

removeAllLogGroups
removeSavedQueries
scheduleSecretsDeletion

echo "Environment destroy complete."

popd
