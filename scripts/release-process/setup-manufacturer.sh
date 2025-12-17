#!/bin/bash

if [[ -z "$1" || -z "$2" ]]; then
  echo "Usage: ./scripts/release-process/setup-manufacturer.sh envName.env ref"
  exit 1
fi

if [[ "$1" != *.env ]]; then
  echo "Error: The file must have a .env extension!"
  exit 1
fi

if [ "${2#v}" != "$2" ]; then
  VERSION="${2#v}"
else
  VERSION="$2"
fi


UI_BASE_DIR="ui/env/"
INFRA_MAIN_BASE_DIR="infra/main/env/"

UI_FILE="${UI_BASE_DIR}$1"
INFRA_MAIN_FILE="${INFRA_MAIN_BASE_DIR}$1"
INFRA_DB_FILE="infra/db/env/defaults.env"
INFRA_DEV_FILE="infra/dev/env/defaults.env"
INFRA_SHARED_FILE="infra/shared/env/defaults.env"

DATE=$(date +"%d/%m/%Y")

DATE_STRING="\"$DATE\""

function update_env_file() {
  local FILE=$1
  local KEY=$2
  local VALUE=$3

  if [ ! -f "$FILE" ]; then
  echo "Error: File '$FILE' not found!"
  exit 1
  fi

  if grep -q "^$KEY=" "$FILE"; then
    sed -i "s|^$KEY=.*|$KEY=$VALUE|" "$FILE"
    echo "Updated '$KEY' in $FILE with value: $VALUE"
  else
    echo "" >> "$FILE"
    echo "$KEY=$VALUE" >> "$FILE"
    echo "Added '$KEY' to $FILE with value: $VALUE"
  fi
}

update_env_file "$INFRA_MAIN_FILE" "NHC_VERSION" "$VERSION"
update_env_file "$INFRA_DB_FILE" "NHC_VERSION" "$VERSION"
update_env_file "$INFRA_DEV_FILE" "NHC_VERSION" "$VERSION"
update_env_file "$INFRA_SHARED_FILE" "NHC_VERSION" "$VERSION"
update_env_file "$UI_FILE" "REACT_APP_NHC_VERSION" "$VERSION"
update_env_file "$UI_FILE" "REACT_APP_MANUFACTURE_DATE" "$DATE"