#!/bin/bash

ENV_NAME=$1
if [ -z "$ENV_NAME" ]; then
  echo "please provide the name of the environment as parameter"
  exit
fi
ENV_NAME=$(echo "$ENV_NAME" | awk '{print tolower($0)}')

TABLE_NAME="${ENV_NAME}-nhc-health-check-db"

items=$(aws dynamodb scan \
  --table-name "$TABLE_NAME" \
  --filter-expression "questionnaire.detailedEthnicGroup = :oldValue" \
  --expression-attribute-values '{":oldValue": {"S": "Other"}}' \
  --query "Items[*].{id:id, ethnicBackground: questionnaire.M.ethnicBackground}")

total_items=$(echo "$items" | jq -c '.[]' | wc -l | xargs)

if [ "$total_items" -gt 0 ]; then
    for item in $(echo "$items" | jq -c '.[]'); do
        id=$(echo "$item" | jq -r '.id.S')
        ethnicBackground=$(echo "$item" | jq -r '.ethnicBackground.S')

        case "$ethnicBackground" in
            AsianOrAsianBritish)
                newDetailedEthnicValue="OtherAsianBackground"
            ;;
            BlackAfricanCaribbeanOrBlackBritish)
                newDetailedEthnicValue="OtherBlackAfricanCaribbeanBackground"
            ;;
            White)
                newDetailedEthnicValue="OtherWhiteBackground"
            ;;
            MixedOrMultipleGroups)
                newDetailedEthnicValue="OtherMixedBackground"
            ;;
            *)
                newDetailedEthnicValue="OtherEthnicGroup"
            ;;
        esac
        echo "Updating id=$id, with current ethnicBackground=$ethnicBackground with a new detailedEthnicBackground=$newDetailedEthnicValue"

        aws dynamodb update-item \
            --table-name "$TABLE_NAME" \
            --key "{\"id\": {\"S\": \"$id\"}}" \
            --update-expression "SET questionnaire.detailedEthnicGroup = :newValue" \
            --expression-attribute-values "{\":newValue\": {\"S\": \"$newDetailedEthnicValue\"}}"
    done
else
    echo "No items to update for 'Other' values on property detailedEthnicBackground"
fi