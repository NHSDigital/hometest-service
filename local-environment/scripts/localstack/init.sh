#!/bin/bash
set -e
SCRIPT_DIR=$(dirname "$0")

# Deploy Lambda functions
bash "$SCRIPT_DIR/deploy-lambdas.sh"
