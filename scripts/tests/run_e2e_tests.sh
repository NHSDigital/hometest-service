#!/bin/bash
# Runs Playwright end-to-end tests against the local environment.

# apt-get update
# apt-get install -y docker-cli curl

# curl https://mise.run | sh
export PATH="$HOME/.local/share/mise/bin:$PATH"
export PATH="$HOME/.local/share/mise/shims:$PATH"
export PATH="$HOME/.local/bin:$PATH"

cd /repo
mise trust -a
mise install

# export UI_BASE_URL=$(terraform -chdir=local-environment/infra output -raw ui_url)
# export API_BASE_URL=$(terraform -chdir=local-environment/infra output -raw backend_base_url)
# export AUTH_TYPE=wiremock
export PLAYWRIGHT_HTML_OPEN=never

echo "UI_BASE_URL: $UI_BASE_URL"
echo "API_BASE_URL: $API_BASE_URL"
echo "AUTH_TYPE: $AUTH_TYPE"

npm install
# npm run stop
# npm run start

cd /repo/tests
# playwright install --with-deps
# npx playwright install-deps
npx playwright install
npx playwright test --project=chromium


# API_BASE_URL=http://localhost:4566/_aws/execute-api/es6ugylbpc/local
# HEADLESS=true
# UI_BASE_URL=http://localhost:3000
# WIREMOCK_BASE_URL=http://localhost:8080

# TIMEOUT=30000
# SLOW_MO=0
# AUTH_TYPE=wiremock
# ENVIRONMENT=local

# #DB configuration
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=local_hometest_db
# DB_USER=admin
# DB_PASSWORD=admin
