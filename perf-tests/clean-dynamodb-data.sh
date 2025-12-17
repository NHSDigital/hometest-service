#!/bin/bash

# Check if environment name is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <env_name>"
  exit 1
fi

ENV_NAME=$1

# Define table names
HEALTH_CHECK_TABLE="${ENV_NAME}-nhc-health-check-db"
ORDER_TABLE="${ENV_NAME}-nhc-order-db"
PATIENT_TABLE="${ENV_NAME}-nhc-patient-db"

# Function to delete all items from a DynamoDB table
delete_all_items() {
  local TABLE_NAME=$1
  local PARTITION_KEY=$2
  echo "Deleting all items from table: $TABLE_NAME"

  # Scan the table and get all item keys
  KEYS=$(aws dynamodb scan --table-name $TABLE_NAME --attributes-to-get "$PARTITION_KEY" --query "Items[].$PARTITION_KEY.S" --output text)

  if [ -z "$KEYS" ]; then
    echo "No items found in table: $TABLE_NAME"
    return
  fi

  # Batch size for deletion
  BATCH_SIZE=25
  ITEMS=()

  # Loop through each key and prepare the batch delete request
  for KEY in $KEYS; do
    ITEMS+=("{\"DeleteRequest\": {\"Key\": {\"$PARTITION_KEY\": {\"S\": \"$KEY\"}}}}")

    # If batch size is reached, send the batch delete request
    if [ ${#ITEMS[@]} -eq $BATCH_SIZE ]; then
      aws dynamodb batch-write-item --request-items "{\"$TABLE_NAME\": [$(IFS=,; echo "${ITEMS[*]}")]}"
      ITEMS=()
    fi
  done

  # Send any remaining items in the last batch
  if [ ${#ITEMS[@]} -gt 0 ]; then
    aws dynamodb batch-write-item --request-items "{\"$TABLE_NAME\": [$(IFS=,; echo "${ITEMS[*]}")]}"
  fi

  echo "All items deleted from table: $TABLE_NAME"
}

# Delete all items from each table
delete_all_items $HEALTH_CHECK_TABLE "id"
delete_all_items $ORDER_TABLE "id"
delete_all_items $PATIENT_TABLE "nhsNumber"

echo "All entries deleted from tables: $HEALTH_CHECK_TABLE, $ORDER_TABLE, $PATIENT_TABLE"