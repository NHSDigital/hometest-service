#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

grype "dir:${PROJECT_DIR}" \
  -o template \
  -t "${PROJECT_DIR}/scripts/config/grype-table.tmpl" \
  --name hometest-service \
  -c "${PROJECT_DIR}/scripts/config/grype.yaml"
