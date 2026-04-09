import { execFileSync } from "node:child_process";
import * as path from "node:path";

import { WireMockClient } from "./api/clients/WireMockClient";
import { AuthType, ConfigFactory } from "./configuration/EnvironmentConfiguration";
import { CredentialsHelper } from "./utils";
import { UserManagerFactory } from "./utils/users";
import {
  cleanupWireMockAuthState,
  configureWireMockAuthMappings,
  createWireMockAuthManifest,
  createWireMockCatchAllAuthorizeMapping,
} from "./utils/users/wiremockAuthMappings";
import { createWireMockUserInfoMapping } from "./utils/users/wiremockUserInfoMapping";
import { createOSPlacesCatchAllMapping } from "./utils/wireMockMappings/OSPlacesWireMockMappings";
import { createSupplierOAuthTokenMapping } from "./utils/wireMockMappings/SupplierOAuthWireMockMappings";
import { createSupplierOrderSuccessMapping } from "./utils/wireMockMappings/SupplierOrderWireMockMappings";

async function globalSetup() {
  console.log("🚀 Global setup started");
  console.log(`Tests will run on environment: ${process.env.ENV ?? "local"}`);

  const config = ConfigFactory.getConfig();
  if (config.authType === AuthType.WIREMOCK) {
    cleanupWireMockAuthState();

    const wiremock = new WireMockClient(config.wiremockBaseUrl);
    const manifest = createWireMockAuthManifest();

    await configureWireMockAuthMappings(wiremock, manifest);

    for (const user of [...manifest.workerUsers, ...Object.values(manifest.specialUsers)]) {
      await wiremock.createMapping(
        createWireMockUserInfoMapping(
          user,
          user.authContext.accessToken,
          user.authContext.sub,
          config.wiremockBaseUrl,
        ),
      );
    }

    // Push catch-all /authorize fallback for browsers without login_hint
    await wiremock.createMapping(createWireMockCatchAllAuthorizeMapping(manifest.workerUsers[0]));

    // Push static supplier and OS Places stubs (wiped by resetAllMappings above)
    await wiremock.createMapping(createSupplierOAuthTokenMapping());
    await wiremock.createMapping(createSupplierOrderSuccessMapping());
    await wiremock.createMapping(createOSPlacesCatchAllMapping());

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
