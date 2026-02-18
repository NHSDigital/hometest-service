#!/usr/bin/env bash

set -euo pipefail

LOGIN_ENDPOINT=$(terraform -chdir=local-environment/infra output -raw login_endpoint)

printf 'NEXT_PUBLIC_LOGIN_LAMBDA_ENDPOINT=%s\n' "$LOGIN_ENDPOINT" > ./ui/.env.local

echo "Updated ui local env file from terraform outputs"
