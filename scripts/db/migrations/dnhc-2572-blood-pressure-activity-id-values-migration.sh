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

update_dynamodb_items "$TABLE_NAME" "questionnaire.bloodPressureLocation" "With a monitor at home" "HomeMonitor"
update_dynamodb_items "$TABLE_NAME" "questionnaire.bloodPressureLocation" "Monitor" "HomeMonitor"
update_dynamodb_items "$TABLE_NAME" "questionnaire.bloodPressureLocation" "At a clinic or pharmacy by a healthcare professional" "Pharmacy"

update_dynamodb_items "$TABLE_NAME" "questionnaireScores.bloodPressureCategory" "Slightly Raised" "SlightlyRaised"

update_dynamodb_items "$TABLE_NAME" "questionnaireScores.activityCategory" "Moderately active" "ModeratelyActive"
update_dynamodb_items "$TABLE_NAME" "questionnaireScores.activityCategory" "Moderately inactive" "ModeratelyInactive"

update_dynamodb_items "$TABLE_NAME" "questionnaire.cycleHours" "Less than 1 hour" "LessThanOne"
update_dynamodb_items "$TABLE_NAME" "questionnaire.cycleHours" "More than 1 hour but less than 3" "BetweenOneAndThree"
update_dynamodb_items "$TABLE_NAME" "questionnaire.cycleHours" "3 hours or more" "ThreeHoursOrMore"

update_dynamodb_items "$TABLE_NAME" "questionnaire.exerciseHours" "Less than 1 hour" "LessThanOne"
update_dynamodb_items "$TABLE_NAME" "questionnaire.exerciseHours" "More than 1 hour but less than 3" "BetweenOneAndThree"
update_dynamodb_items "$TABLE_NAME" "questionnaire.exerciseHours" "3 hours or more" "ThreeHoursOrMore"

update_dynamodb_items "$TABLE_NAME" "questionnaire.gardeningHours" "Less than 1 hour" "LessThanOne"
update_dynamodb_items "$TABLE_NAME" "questionnaire.gardeningHours" "More than 1 hour but less than 3" "BetweenOneAndThree"
update_dynamodb_items "$TABLE_NAME" "questionnaire.gardeningHours" "3 hours or more" "ThreeHoursOrMore"

update_dynamodb_items "$TABLE_NAME" "questionnaire.houseworkHours" "Less than 1 hour" "LessThanOne"
update_dynamodb_items "$TABLE_NAME" "questionnaire.houseworkHours" "More than 1 hour but less than 3" "BetweenOneAndThree"
update_dynamodb_items "$TABLE_NAME" "questionnaire.houseworkHours" "3 hours or more" "ThreeHoursOrMore"

update_dynamodb_items "$TABLE_NAME" "questionnaire.walkHours" "Less than 1 hour" "LessThanOne"
update_dynamodb_items "$TABLE_NAME" "questionnaire.walkHours" "More than 1 hour but less than 3" "BetweenOneAndThree"
update_dynamodb_items "$TABLE_NAME" "questionnaire.walkHours" "3 hours or more" "ThreeHoursOrMore"

echo -e "\nUpdate completed for table: $TABLE_NAME"

echo "All updates completed successfully."