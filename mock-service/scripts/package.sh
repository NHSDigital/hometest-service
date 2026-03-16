#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
OUT_DIR="$DIST_DIR/mock-service-lambda"
ZIP_PATH="$DIST_DIR/mock-service-lambda.zip"

echo "Creating deployment zip for mock-service..."

if [[ ! -d "$OUT_DIR" ]]; then
  echo "No dist directory found — run 'npm run build' first"
  exit 1
fi

rm -f "$ZIP_PATH"

cd "$OUT_DIR"
zip -r "$ZIP_PATH" bootstrap mappings/

echo "Created $ZIP_PATH ($(du -h "$ZIP_PATH" | cut -f1))"
