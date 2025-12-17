#!/bin/bash

ENV_NAME=$1
SIMULATION=$2

source $(dirname "${BASH_SOURCE[0]}")/../scripts/aws/functions.sh

HEALTH_CHECK_CLOUDFRONT_DOMAIN="${ENV_NAME}.dhctest.org"
HEALTH_CHECK_API_DOMAIN="${ENV_NAME}-api.dhctest.org"
RESULTS_COGNITO_AUTH_URL="${ENV_NAME}-results.auth.eu-west-2.amazoncognito.com"
RESULTS_API_URL="${ENV_NAME}-results-api.dhctest.org"
RESULTS_COGNITO_CLIENT_ID=$(fetchSecretValue "nhc/$ENV_NAME/results-cognito-client-id")
RESULTS_COGNITO_CLIENT_SECRET=$(fetchSecretValue "nhc/$ENV_NAME/results-cognito-client-secret")
MOCK_API_URL=$(echo "${ENV_NAME}-mock-api.dhctest.org")

case $SIMULATION in
  single-user)
    JOURNEY_STARTED_USERS=0
    JOURNEY_STARTED_RAMP_UP_SECONDS=0
    JOURNEY_COMPLETED_USERS=1
    JOURNEY_COMPLETED_RAMP_UP_SECONDS=0
    ;;
  load-test)
    JOURNEY_STARTED_USERS=144
    JOURNEY_STARTED_RAMP_UP_SECONDS=3600
    JOURNEY_COMPLETED_USERS=84
    JOURNEY_COMPLETED_RAMP_UP_SECONDS=3600
    ;;
  stress-test)
    JOURNEY_STARTED_USERS=1440
    JOURNEY_STARTED_RAMP_UP_SECONDS=3600
    JOURNEY_COMPLETED_USERS=840
    JOURNEY_COMPLETED_RAMP_UP_SECONDS=3600
    ;;
  soak-test)
    JOURNEY_STARTED_USERS=770
    JOURNEY_STARTED_RAMP_UP_SECONDS=18000
    JOURNEY_COMPLETED_USERS=420
    JOURNEY_COMPLETED_RAMP_UP_SECONDS=18000
    ;;
  *)
    echo "Invalid simulation type. Please choose from: single-user, load-test, stress-test, soak-test."
    exit 1
    ;;
esac

echo "HEALTH_CHECK_CLOUDFRONT_DOMAIN=$HEALTH_CHECK_CLOUDFRONT_DOMAIN" > test.properties
echo "HEALTH_CHECK_API_DOMAIN=$HEALTH_CHECK_API_DOMAIN" >> test.properties
echo "RESULTS_COGNITO_AUTH_URL=$RESULTS_COGNITO_AUTH_URL" >> test.properties
echo "RESULTS_API_URL=$RESULTS_API_URL" >> test.properties
echo "RESULTS_COGNITO_CLIENT_ID=$RESULTS_COGNITO_CLIENT_ID" >> test.properties
echo "RESULTS_COGNITO_CLIENT_SECRET=$RESULTS_COGNITO_CLIENT_SECRET" >> test.properties
echo "MOCK_API_URL=$MOCK_API_URL" >> test.properties

echo "JOURNEY_STARTED_USERS=$JOURNEY_STARTED_USERS" >> test.properties
echo "JOURNEY_STARTED_RAMP_UP_SECONDS=$JOURNEY_STARTED_RAMP_UP_SECONDS" >> test.properties
echo "JOURNEY_COMPLETED_USERS=$JOURNEY_COMPLETED_USERS" >> test.properties
echo "JOURNEY_COMPLETED_RAMP_UP_SECONDS=$JOURNEY_COMPLETED_RAMP_UP_SECONDS" >> test.properties

echo "Successfully generated test.properties file using '$ENV_NAME' environment data and '$SIMULATION' simulation settings."
