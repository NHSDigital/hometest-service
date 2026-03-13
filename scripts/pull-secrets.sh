#!/usr/bin/env bash
#
# Pull secrets from AWS Secrets Manager into the local secrets directory.
# Usage:
#   ./scripts/pull-secrets.sh [environment]
#
# Defaults to "dev" environment. Requires valid AWS credentials
# (e.g. via AWS SSO, environment variables, or IAM role).

set -euo pipefail

ENVIRONMENT="${1:-dev}"
AWS_REGION="${AWS_REGION:-eu-west-2}"
SECRETS_DIR="$(cd "$(dirname "$0")/.." && pwd)/local-environment/infra/resources/secrets"

mkdir -p "$SECRETS_DIR"

# Map of AWS secret name -> local filename
declare -A SECRET_MAP=(
  ["nhs-hometest/${ENVIRONMENT}/nhs-login-private-key"]="nhs-login-private-key.pem"
  ["nhs-hometest/${ENVIRONMENT}/os-places-creds"]="os-places-creds.json"
  ["nhs-hometest/${ENVIRONMENT}/preventex-dev-client-secret"]="test_supplier_client_secret.txt"
)

pull_secret() {
  local aws_name="$1"
  local local_file="$2"
  local target="${SECRETS_DIR}/${local_file}"

  echo "Pulling '${aws_name}' -> ${local_file}..."

  value=$(aws secretsmanager get-secret-value \
    --secret-id "$aws_name" \
    --region "$AWS_REGION" \
    --query 'SecretString' \
    --output text 2>&1) || {
    echo "  WARNING: Failed to pull '${aws_name}' — skipping (${value})"
    return 0
  }

  printf '%s' "$value" > "$target"
  chmod 600 "$target"
  echo "  Saved to ${target}"
}

echo "Pulling secrets for environment '${ENVIRONMENT}' from region '${AWS_REGION}'..."
echo ""

for aws_name in "${!SECRET_MAP[@]}"; do
  pull_secret "$aws_name" "${SECRET_MAP[$aws_name]}"
done

echo ""
echo "Done. Secrets written to ${SECRETS_DIR}"
