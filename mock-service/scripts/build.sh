#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MAPPINGS_SRC="$ROOT_DIR/../local-environment/wiremock/mappings"
DIST_DIR="$ROOT_DIR/dist"
OUT_DIR="$DIST_DIR/mock-service-lambda"

echo "Building mock-service (stubr) for Lambda..."

cd "$ROOT_DIR"
cargo lambda build --release --arm64

# Prepare output directory
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

# Copy the bootstrap binary
cp target/lambda/mock-service/bootstrap "$OUT_DIR/bootstrap"

# Copy WireMock JSON mapping files
if [[ -d "$MAPPINGS_SRC" ]]; then
  cp -r "$MAPPINGS_SRC" "$OUT_DIR/mappings"
  echo "Copied WireMock mappings from $MAPPINGS_SRC"
else
  echo "WARNING: WireMock mappings directory not found at $MAPPINGS_SRC"
fi

echo "Build complete: $OUT_DIR"
