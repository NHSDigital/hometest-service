#!/bin/bash

ENV_NAME=$1
if [ -z "$ENV_NAME" ]; then
  echo "please provide the name of the environment as parameter"
  exit
fi
ENV_NAME=$(echo "$ENV_NAME" | awk '{print tolower($0)}')

TABLE_NAME="${ENV_NAME}-nhc-health-check-db"

update_dynamodb_items() {
  local TABLE_NAME="$1"
  local PROPERTY="$2"
  local OLD_VALUE="$3"
  local NEW_VALUE="$4"

  items=$(aws dynamodb scan --table-name "$TABLE_NAME" --filter-expression "$PROPERTY = :oldValue" --expression-attribute-values "{\":oldValue\": {\"S\": \"$OLD_VALUE\"}}" --query "Items[*].{id:id}")

  total_items=$(echo "$items" | jq -c '.[]' | wc -l | xargs)
  progress=0

  if [ "$total_items" -gt 0 ]; then
    for item in $(echo "$items" | jq -c '.[]'); do
      id=$(echo "$item" | jq -r '.id.S')

      aws dynamodb update-item \
        --table-name "$TABLE_NAME" \
        --key "{\"id\": {\"S\": \"$id\"}}" \
        --update-expression "SET $PROPERTY = :newValue" \
        --expression-attribute-values "{\":newValue\": {\"S\": \"$NEW_VALUE\"}}" &
      progress=$((progress + 1))
      printf "\rUpdating $PROPERTY from '$OLD_VALUE' to '$NEW_VALUE': %d/%d" "$progress" "$total_items"
    done
    wait
    echo ""
  else
    echo "No items to update for $PROPERTY from '$OLD_VALUE' to '$NEW_VALUE'"
  fi
}

echo "Processing table: $TABLE_NAME"

update_dynamodb_items "$TABLE_NAME" "questionnaire.hasFamilyHeartAttackHistory" "I do not know" "Unknown"

update_dynamodb_items "$TABLE_NAME" "questionnaire.hasFamilyDiabetesHistory" "I do not know" "Unknown"

update_dynamodb_items "$TABLE_NAME" "questionnaire.ethnicBackground" "Asian or Asian British" "AsianOrAsianBritish"
update_dynamodb_items "$TABLE_NAME" "questionnaire.ethnicBackground" "Black, African, Caribbean or Black British" "BlackAfricanCaribbeanOrBlackBritish"
update_dynamodb_items "$TABLE_NAME" "questionnaire.ethnicBackground" "Mixed or multiple ethnic groups" "MixedOrMultipleGroups"
update_dynamodb_items "$TABLE_NAME" "questionnaire.ethnicBackground" "Other ethnic group" "Other"

update_dynamodb_items "$TABLE_NAME" "questionnaire.detailedEthnicGroup" "Any other Asian background" "Other"
update_dynamodb_items "$TABLE_NAME" "questionnaire.detailedEthnicGroup" "Any other Black, African, or Caribbean background" "Other"
update_dynamodb_items "$TABLE_NAME" "questionnaire.detailedEthnicGroup" "White and Asian" "WhiteAndAsian"
update_dynamodb_items "$TABLE_NAME" "questionnaire.detailedEthnicGroup" "White and Black African" "WhiteAndBlackAfrican"
update_dynamodb_items "$TABLE_NAME" "questionnaire.detailedEthnicGroup" "White and Black Caribbean" "WhiteAndBlackCaribbean"
update_dynamodb_items "$TABLE_NAME" "questionnaire.detailedEthnicGroup" "Any other Mixed or multiple ethnic background" "Other"
update_dynamodb_items "$TABLE_NAME" "questionnaire.detailedEthnicGroup" "English, Welsh, Scottish, Northern Irish or British" "EnglishWelshScottishNIBritish"
update_dynamodb_items "$TABLE_NAME" "questionnaire.detailedEthnicGroup" "Gypsy or Irish Traveller" "GypsyOrIrishTraveller"
update_dynamodb_items "$TABLE_NAME" "questionnaire.detailedEthnicGroup" "Any other White background" "Other"
update_dynamodb_items "$TABLE_NAME" "questionnaire.detailedEthnicGroup" "Any other ethnic group" "Other"

update_dynamodb_items "$TABLE_NAME" "questionnaire.smoking" "No, I have never smoked" "Never"
update_dynamodb_items "$TABLE_NAME" "questionnaire.smoking" "No, I quit smoking" "Quitted"
update_dynamodb_items "$TABLE_NAME" "questionnaire.smoking" "Yes, I smoke 1 to 9 cigarettes a day" "UpToNinePerDay"
update_dynamodb_items "$TABLE_NAME" "questionnaire.smoking" "Yes, I smoke 10 to 19 cigarettes a day" "TenToNineteenPerDay"
update_dynamodb_items "$TABLE_NAME" "questionnaire.smoking" "Yes, I smoke 20 or more cigarettes a day" "TwentyOrMorePerDay"

echo -e "\nUpdate completed for table: $TABLE_NAME"

echo "All updates completed successfully."