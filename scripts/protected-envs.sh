#!/bin/bash
set -e

PROTECTED_ENVS=("demo" "test" "int" "develop" "prod")

is_protected_env() {
    local env_name="$1"
    for item in "${PROTECTED_ENVS[@]}"; do
        if [[ "$item" == "$env_name" ]]; then
            return 0
        fi
    done
    return 1
}

check_protected_env_deploy() {
    local env_name="$1"
    if is_protected_env "$env_name"; then
        echo "$env_name is a protected environment, please use the pipeline on GitHub to deploy to this environment"
        exit 1
    fi
}

check_protected_env_destroy() {
    local env_name="$1"

    for item in "${PROTECTED_ENVS[@]}"; do
        if [[ "$item" == "$env_name" ]]; then
           echo "NOTICE: $item is a protected environment used across teams"
           read -p "Are you sure you want to delete this environment? (y/n)" CONTINUE
            if [ "$CONTINUE"!="y"  ] || [ "$CONTINUE"!="Y" ]; then
                echo "Exiting Destroy of Environment . . ." 
                exit 1
            fi
        fi
    done
}