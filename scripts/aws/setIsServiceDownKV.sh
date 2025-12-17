#!/bin/bash

##########################################################
# Populate/Set cloudfront kv store isServiceDown key pair
# ./setIsServiceDownKV.sh <env_name> <isServiceDown>
# ./setIsServiceDownKV.sh lukaszj false
##########################################################

# Check if the correct number of arguments are provided
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <env_name> <isServiceDown>"
  exit 1
fi

# Assign arguments to variables
ENV_NAME=$1
IS_SERVICE_DOWN=$2

# Validate isServiceDown value
if [[ "$IS_SERVICE_DOWN" != "true" && "$IS_SERVICE_DOWN" != "false" ]]; then
  echo "Error: isServiceDown must be 'true' or 'false'"
  exit 1
fi

KEY_VALUE_STORE_NAME="${ENV_NAME}NhcUiViewerRequestHandler-kv-store"
KV_STORE_ARN=$(aws cloudfront describe-key-value-store --name "$KEY_VALUE_STORE_NAME" --query 'KeyValueStore.ARN' --output text)
ETAG=$(aws cloudfront-keyvaluestore describe-key-value-store --kvs-arn="$KV_STORE_ARN" --query 'ETag' --output text)

echo "Updating cloudfront key value store..."
aws cloudfront-keyvaluestore put-key \
  --key="isServiceDown" \
  --kvs-arn="$KV_STORE_ARN" \
  --value="$IS_SERVICE_DOWN" \
  --if-match="$ETAG" \

# Check if the command was successful
if [ $? -eq 0 ]; then
  echo "Successfully updated KeyValueStore '$KEY_VALUE_STORE_NAME' with isServiceDown=$IS_SERVICE_DOWN"
else
  echo "Failed to update KeyValueStore '$KEY_VALUE_STORE_NAME'"
  exit 1
fi
