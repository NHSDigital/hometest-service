/**
 * WireMock pre-setup for k6 performance tests.
 *
 * Run this with `npx tsx perf-tests/setup.ts` from the project root before running k6.
 * It mirrors the WireMock portion of tests/global-setup.ts:
 *   - Generates per-VU RSA key pairs, JWTs, and auth codes
 *   - Registers per-VU /authorize, /token, /.well-known/jwks.json, and /userinfo stubs
 *   - Writes the auth manifest to tests/.session-cache/  (read by the k6 test via open())
 *
 * Usage:
 *   npx tsx perf-tests/setup.ts
 *   k6 run --env TARGET_URL=http://localhost:3000 perf-tests/UiPerformancePocTest.js
 */
import { execFileSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { WireMockClient } from "../tests/api/clients/WireMockClient";
import {
  cleanupWireMockAuthState,
  configureWireMockAuthMappings,
  createWireMockAuthManifest,
  getWireMockAuthManifestPath,
} from "../tests/utils/users/wiremockAuthMappings";
import { createWireMockUserInfoMapping } from "../tests/utils/users/wiremockUserInfoMapping";

const WIREMOCK_BASE_URL = process.env.WIREMOCK_BASE_URL ?? "http://localhost:8080";

async function setup(): Promise<void> {
  console.log("Setting up WireMock auth for performance tests...");
  console.log(`WireMock base URL: ${WIREMOCK_BASE_URL}`);

  cleanupWireMockAuthState();

  const wiremock = new WireMockClient(WIREMOCK_BASE_URL);
  const manifest = createWireMockAuthManifest();

  await configureWireMockAuthMappings(wiremock, manifest);

  for (const user of [...manifest.workerUsers, ...Object.values(manifest.specialUsers)]) {
    await wiremock.createMapping(
      createWireMockUserInfoMapping(user, user.authContext.accessToken, user.authContext.sub),
    );
  }

  const scriptPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../scripts/tests/reset-login-lambda-cache.sh",
  );

  try {
    execFileSync("bash", [scriptPath], { stdio: "inherit" });
  } catch {
    console.warn("Could not reset login Lambda cache — continuing anyway");
  }

  console.log(
    `Setup complete. ${manifest.workerUsers.length} worker users configured in WireMock.`,
  );
  console.log(`Auth manifest written to: ${getWireMockAuthManifestPath()}`);
}

setup().catch((error: unknown) => {
  console.error("Performance test setup failed:", error);
  process.exit(1);
});
