#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAMBDAS_DIR="$(dirname "$SCRIPT_DIR")"
OUT_DIR="$LAMBDAS_DIR/out"

mkdir -p "$OUT_DIR"

# Parse arguments for specific lambda
SPECIFIC_LAMBDA=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --lambda)
            SPECIFIC_LAMBDA="$2"
            shift 2
            ;;
        *)
            echo "Usage: $0 [--lambda <lambda-name>]"
            exit 1
            ;;
    esac
done

# Function to create zip for a lambda
create_lambda_zip() {
    local lambda_dir=$1
    echo "Creating deployment zip for $lambda_dir..."

    cd "$LAMBDAS_DIR/$lambda_dir"

    # Clean previous zip in out directory
    rm -f "$OUT_DIR/${lambda_dir}.zip"

    # Only include the built output - esbuild bundles everything needed
    if [ -d "dist" ]; then
        zip -r "$OUT_DIR/${lambda_dir}.zip" dist/ package.json
    else
        echo "Warning: No dist directory found for $lambda_dir"
        return 1
    fi

    echo "Created $OUT_DIR/${lambda_dir}.zip"
}

# Change to lambdas directory to find lambda folders
cd "$LAMBDAS_DIR"

if [ -n "$SPECIFIC_LAMBDA" ]; then
    create_lambda_zip "$SPECIFIC_LAMBDA"
else
    for lambda_dir in *-lambda; do
        if [ -d "$lambda_dir" ]; then
            create_lambda_zip "$lambda_dir"
        fi
    done
fi

echo "Deployment packages ready in $OUT_DIR"
