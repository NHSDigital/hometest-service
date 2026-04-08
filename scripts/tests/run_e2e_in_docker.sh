#!/bin/bash

GIT_ROOT=$(git rev-parse --show-toplevel)

# cd /tmp
# sudo rm -rf hometest-service
# [[ -d hometest-service ]] || git clone git@github.com:NHSDigital/hometest-service.git

# cp -rfv $GIT_ROOT/scripts/tests/run_e2e_tests.sh /tmp/hometest-service/scripts/tests/run_e2e_tests.sh
# cp -rfv $GIT_ROOT/scripts/tests/Dockerfile /tmp/hometest-service/scripts/tests/Dockerfile

# cp -rfv $GIT_ROOT/local-environment/infra/resources/secrets/nhs-login-private-key.pem /tmp/hometest-service/local-environment/infra/resources/secrets/nhs-login-private-key.pem
# cp -rfv $GIT_ROOT/local-environment/infra/resources/secrets/os-places-creds.json /tmp/hometest-service/local-environment/infra/resources/secrets/os-places-creds.json
# cp -rfv $GIT_ROOT/tests/credentials.ts /tmp/hometest-service/tests/credentials.ts
# cp -rfv $GIT_ROOT/tests/configuration/.env.local /tmp/hometest-service/tests/configuration/.env.local

# cd hometest-service
docker build -f scripts/tests/Dockerfile -t playwright-e2e .
docker run --network=host --rm -v /tmp/mise:/root/.local/share/mise -v /tmp/playwright:/root/.cache/ms-playwright -v $(pwd):/repo -v /var/run/docker.sock:/var/run/docker.sock playwright-e2e /repo/scripts/tests/run_e2e_tests.sh
