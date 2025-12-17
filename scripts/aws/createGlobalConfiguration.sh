#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 <env>"
  exit 1
fi

AWS_ACCOUNT_NAME=$1
ENV=$2

# Create AWS Parameter Store keys
# Part of post-deploy step, to be run against developer environments

create_parameter_if_not_exists() {
  local param_name=$1
  local param_value=$2
  
  if aws ssm put-parameter --name "$param_name" --value "$param_value" --type "String" 2>/dev/null; then
    echo "Created parameter: $param_name"
  else
    echo "Parameter already exists: $param_name"
  fi
}

create_parameter_if_not_exists "/${ENV}/dhc/gpPracticeEmailEnabled" "false"
create_parameter_if_not_exists "/${ENV}/dhc/pdmEnabled" "false"
create_parameter_if_not_exists "/${ENV}/dhc/hcExpiryNotificationEnabled" "false"
create_parameter_if_not_exists "/${ENV}/dhc/mnsEnabled" "false"

echo "AWS Parameter Store keys created on account ${AWS_ACCOUNT_NAME} for environment: ${ENV}"