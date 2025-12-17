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

update_dynamodb_items "$TABLE_NAME" "questionnaire.drinkAlcohol" "No, I've never had a drink of alcohol" "Never"
update_dynamodb_items "$TABLE_NAME" "questionnaire.drinkAlcohol" "No, I used to drink alcohol but I do not anymore" "UsedTo"
update_dynamodb_items "$TABLE_NAME" "questionnaire.drinkAlcohol" "Yes, I drink alcohol" "Yes"

update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholHowOften" "Monthly or less" "MonthlyOrLess"
update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholHowOften" "2 to 4 times a month" "TwoToFourTimesAMonth"
update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholHowOften" "2 to 3 times a week" "TwoToThreeTimesAWeek"
update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholHowOften" "4 times or more a week" "FourTimesOrMoreAWeek"

update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholDailyUnits" "0 to 2" "ZeroToTwo"
update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholDailyUnits" "3 to 4" "ThreeToFour"
update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholDailyUnits" "5 to 6" "FiveToSix"
update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholDailyUnits" "7 to 9" "SevenToNine"
update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholDailyUnits" "10 or more" "TenOrMore"

update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholConcernedRelative" "Yes, but not in the past year" "YesNotPastYear"
update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholConcernedRelative" "Yes, during the past year" "YesDuringPastYear"

update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholPersonInjured" "Yes, but not in the past year" "YesNotPastYear"
update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholPersonInjured" "Yes, during the past year" "YesDuringPastYear"

update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholFailedObligations" "Less than monthly" "LessThanMonthly"
update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholFailedObligations" "Daily or almost daily" "DailyOrAlmost"

update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholGuilt" "Less than monthly" "LessThanMonthly"
update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholGuilt" "Daily or almost daily" "DailyOrAlmost"

update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholMemoryLoss" "Less than monthly" "LessThanMonthly"
update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholMemoryLoss" "Daily or almost daily" "DailyOrAlmost"

update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholMorningDrink" "Less than monthly" "LessThanMonthly"
update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholMorningDrink" "Daily or almost daily" "DailyOrAlmost"

update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholMultipleDrinksOneOccasion" "Less than monthly" "LessThanMonthly"
update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholMultipleDrinksOneOccasion" "Daily or almost daily" "DailyOrAlmost"

update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholCannotStop" "Less than monthly" "LessThanMonthly"
update_dynamodb_items "$TABLE_NAME" "questionnaire.alcoholCannotStop" "Daily or almost daily" "DailyOrAlmost"

update_dynamodb_items "$TABLE_NAME" "questionnaireScores.auditCategory" "No Risk" "NoRisk"
update_dynamodb_items "$TABLE_NAME" "questionnaireScores.auditCategory" "Low Risk" "LowRisk"
update_dynamodb_items "$TABLE_NAME" "questionnaireScores.auditCategory" "Increasing Risk" "IncreasingRisk"
update_dynamodb_items "$TABLE_NAME" "questionnaireScores.auditCategory" "High Risk" "HighRisk"
update_dynamodb_items "$TABLE_NAME" "questionnaireScores.auditCategory" "Possible Dependency" "PossibleDependency"
update_dynamodb_items "$TABLE_NAME" "questionnaireScores.auditCategory" "Possible dependency" "PossibleDependency"

echo -e "\nUpdate completed for table: $TABLE_NAME"

echo "All updates completed successfully."