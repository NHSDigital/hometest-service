import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { WireMockClient } from "./api/clients/WireMockClient";
import { AuthType, ConfigFactory } from "./configuration/EnvironmentConfiguration";
import {
  A11Y_REPORTS_DIR,
  AUTO_REPORTS_DIR,
  SCANNED_URLS_FILE,
} from "./fixtures/accessibilityAutoFixture";
import { CredentialsHelper } from "./utils";
import { UserManagerFactory } from "./utils/users";
import {
  cleanupWireMockAuthState,
  configureWireMockAuthMappings,
  createWireMockAuthManifest,
} from "./utils/users/wiremockAuthMappings";
import { createWireMockUserInfoMapping } from "./utils/users/wiremockUserInfoMapping";

async function globalSetup() {
  console.log("🚀 Global setup started");
  console.log(`Tests will run on environment: ${process.env.ENV ?? "local"}`);

  fs.rmSync(A11Y_REPORTS_DIR, { recursive: true, force: true });
  fs.mkdirSync(AUTO_REPORTS_DIR, { recursive: true });

  fs.mkdirSync(path.dirname(SCANNED_URLS_FILE), { recursive: true });
  fs.writeFileSync(SCANNED_URLS_FILE, JSON.stringify([], null, 2), "utf8");
  try {
    fs.unlinkSync(`${SCANNED_URLS_FILE}.lock`);
  } catch {
    // File may not exist — that is fine.
  }

  const config = ConfigFactory.getConfig();
  if (config.authType === AuthType.WIREMOCK) {
    cleanupWireMockAuthState();

    const wiremock = new WireMockClient(config.wiremockBaseUrl);
    const manifest = createWireMockAuthManifest();

    await configureWireMockAuthMappings(wiremock, manifest);

    for (const user of [...manifest.workerUsers, ...Object.values(manifest.specialUsers)]) {
      await wiremock.createMapping(
        createWireMockUserInfoMapping(user, user.authContext.accessToken, user.authContext.sub),
      );
    }

    resetLoginLambdaCache();
  } else {
    // Only load NHS Login credentials when using the real login flow
    await new CredentialsHelper().addCredentialsToEnvVariable();
  }

  await new UserManagerFactory().getUserManager().loginWorkerUsers();
}

export default globalSetup;

function resetLoginLambdaCache(): void {
  const scriptPath = path.resolve(__dirname, "../scripts/tests/reset-login-lambda-cache.sh");
  try {
    execFileSync("bash", [scriptPath], { stdio: "inherit" });
  } catch {
    console.warn("⚠️  Could not reset login Lambda cache — continuing anyway");
  }
}
