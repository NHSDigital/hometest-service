#!/bin/bash

# Athena Views Setup Script
#
# This script triggers the Step Functions state machine that generates flattened Athena views
# for the specified environment. It ultimately creates three views:
# - nhc-reporting-stack-${environment}-flattened-audit-event-view
# - nhc-reporting-stack-${environment}-flattened-biometric-score-view  
# - nhc-reporting-stack-${environment}-flattened-health-check-view
#
# Prerequisites:
# - AWS CLI configured with appropriate credentials
# - jq installed for JSON parsing
# - The Athena workgroup must exist: ${accountId}-${environment}-bi-reporting
# - The saved queries must exist in the workgroup with the expected names
# - The Step Functions state machine must exist: nhc-${environment}-athena-views-creation-state-machine
#
# Usage: ./athena-views-setup.sh <environment> <account-name>
# Example: ./athena-views-setup.sh develop poc

set -e 
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "${SCRIPT_DIR}/../utils.sh"

REGION="eu-west-2"

get_arguments() {
    if [ $# -eq 0 ]; then
        log_error "Environment parameter is required"
        echo "Usage: $0 <environment> <account-name>"
        echo "Example: $0 develop poc"
        echo "Valid environments: poc, int, test, prod"
        exit 1
    fi
    
    ENVIRONMENT="$1"
    ACCOUNT_NAME="$2"
    
    if ! ACCOUNT_ID=$(get_account_id "$ACCOUNT_NAME"); then
        exit 1
    fi
    
    log_info "Environment: ${ENVIRONMENT}"
    log_info "Account ID: ${ACCOUNT_ID}"
    log_info "Region: ${REGION}"
}

trigger_state_machine() {
    STATE_MACHINE_NAME="nhc-${ENVIRONMENT}-athena-views-creation-state-machine"
    STATE_MACHINE_ARN="arn:aws:states:${REGION}:${ACCOUNT_ID}:stateMachine:${STATE_MACHINE_NAME}"

    log_info "Checking for state machine: ${STATE_MACHINE_NAME}" 
    if ! aws stepfunctions describe-state-machine --state-machine-arn "${STATE_MACHINE_ARN}" --region "${REGION}" >/dev/null 2>&1; then
        log_info "State machine '${STATE_MACHINE_NAME}' not found in region ${REGION}. Ensure the reporting stack with Athena views Step Function is deployed."
        exit 0
    fi

    log_info "Found state machine. Starting execution..."

    INPUT_JSON=$(cat <<EOF
    {
        "flattenedViewNames": [
            "nhc-reporting-stack-${ENVIRONMENT}-flattened-health-check-view",
            "nhc-reporting-stack-${ENVIRONMENT}-flattened-audit-event-view",
            "nhc-reporting-stack-${ENVIRONMENT}-flattened-biometric-score-view"
        ]
    }
EOF
)

    EXECUTION_OUTPUT=$(aws stepfunctions start-execution --state-machine-arn "${STATE_MACHINE_ARN}" --input "${INPUT_JSON}" --region "${REGION}")
    EXECUTION_ARN=$(echo "${EXECUTION_OUTPUT}" | jq -r '.executionArn' 2>/dev/null || echo "(jq not installed, raw output above)")

    log_info "Execution started: ${EXECUTION_ARN}"
    poll_execution "${EXECUTION_ARN}"
}

poll_execution() {
    EXECUTION_ARN="$1"
    # Configuration
    SLEEP_SECONDS="${SLEEP_SECONDS:-5}"          
    MAX_ATTEMPTS="${MAX_ATTEMPTS:-60}"

    if ! command -v jq >/dev/null 2>&1; then
        log_error "jq is required for polling. Install jq (e.g. brew install jq) or set SKIP_POLLING=1."
        return 1
    fi

    if [ "${SKIP_POLLING:-0}" = "1" ]; then
        log_info "Skipping polling (SKIP_POLLING=1). Execution ARN: ${EXECUTION_ARN}"
        return 0
    fi

    log_info "Polling execution status (every ${SLEEP_SECONDS}s, max attempts ${MAX_ATTEMPTS})..."
    attempt=0
    while [ $attempt -lt $MAX_ATTEMPTS ]; do
        attempt=$((attempt+1))
        STATUS_JSON=$(aws stepfunctions describe-execution --execution-arn "${EXECUTION_ARN}" --region "${REGION}") || {
            log_error "Failed to describe execution (attempt ${attempt})."
            sleep "${SLEEP_SECONDS}"
            continue
        }
        STATUS=$(echo "${STATUS_JSON}" | jq -r '.status')
        case "${STATUS}" in
            SUCCEEDED)
                log_success "State machine execution succeeded."
                return 0
                ;;
            FAILED|TIMED_OUT|ABORTED)
                log_error "Execution ended with status: ${STATUS}"
                CAUSE=$(echo "${STATUS_JSON}" | jq -r '.cause')
                ERROR=$(echo "${STATUS_JSON}" | jq -r '.error')
                [ "${ERROR}" != "null" ] && log_error "Error: ${ERROR}" || true
                [ "${CAUSE}" != "null" ] && log_error "Cause: ${CAUSE}" || true
                return 1
                ;;
            RUNNING)
                log_info "Attempt ${attempt}: still RUNNING..."
                ;;
            *)
                log_info "Attempt ${attempt}: status ${STATUS}"
                ;;
        esac
        sleep "${SLEEP_SECONDS}"
    done
    log_error "Max attempts reached without terminal status. Last known status: ${STATUS}" 
    return 1
}

main() {
    get_arguments "$@"
    trigger_state_machine
}

main "$@"

