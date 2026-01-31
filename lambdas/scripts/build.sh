#!/bin/bash

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAMBDAS_DIR="$(dirname "$SCRIPT_DIR")"

# Default values
BUILD_SHARED=true
BUILD_LAMBDAS=true

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --shared-only)
            BUILD_LAMBDAS=false
            shift
            ;;
        --lambdas-only)
            BUILD_SHARED=false
            shift
            ;;
        --lambda)
            BUILD_SHARED=false
            BUILD_LAMBDAS=false
            SPECIFIC_LAMBDA="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--shared-only] [--lambdas-only] [--lambda <lambda-name>]"
            exit 1
            ;;
    esac
done

cd "$LAMBDAS_DIR"

if [ "$BUILD_SHARED" = true ]; then
    echo "Building shared workspace..."
    npm run build --workspace=@hometest-service/shared
fi

if [ "$BUILD_LAMBDAS" = true ]; then
    echo "Building lambda workspaces..."
    for lambda_dir in *-lambda; do
        if [ -d "$lambda_dir" ]; then
            echo "Building $lambda_dir..."
            npm run build --workspace=@hometest-service/"$lambda_dir"
        fi
    done
elif [ -n "$SPECIFIC_LAMBDA" ]; then
    echo "Building specific lambda: $SPECIFIC_LAMBDA..."
    npm run build --workspace=@hometest-service/"$SPECIFIC_LAMBDA"
fi

echo "Build complete!"
