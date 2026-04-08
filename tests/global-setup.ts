import { execFileSync } from "node:child_process";
import * as path from "node:path";

import { type WireMockMapping, WireMockClient } from "./api/clients/WireMockClient";
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
import { createSupplierOAuthTokenMapping } from "./utils/wireMockMappings/SupplierOAuthWireMockMappings";
import { createSupplierOrderSuccessMapping } from "./utils/wireMockMappings/SupplierOrderWireMockMappings";

function createOSPlacesCatchAllMapping(): WireMockMapping {
  return {
    priority: 100,
    request: {
      method: "GET",
      urlPath: "/find",
      queryParameters: { query: { matches: ".*" } },
    },
    response: {
      status: 200,
      headers: { "Content-Type": "application/json" },
      jsonBody: {
        header: {
          uri: "http://wiremock/find",
          query: "query=SW1A1AA",
          offset: 0,
          totalresults: 1,
          format: "JSON",
          dataset: "DPA",
          lr: "EN",
          maxresults: 100,
          epoch: "95",
          output_srs: "EPSG:27700",
        },
        results: [
          {
            DPA: {
              UPRN: "100023336956",
              UDPRN: "52640002",
              ADDRESS: "10 DOWNING STREET, LONDON, SW1A 1AA",
              BUILDING_NUMBER: "10",
              THOROUGHFARE_NAME: "DOWNING STREET",
              POST_TOWN: "LONDON",
              POSTCODE: "SW1A 1AA",
            },
          },
        ],
      },
    },
  };
}

async function globalSetup() {
  console.log("🚀 Global setup started");
  console.log(`Tests will run on environment: ${process.env.ENV ?? "local"}`);

  const config = ConfigFactory.getConfig();
  if (config.authType === AuthType.WIREMOCK) {
    cleanupWireMockAuthState();

    const wiremock = new WireMockClient(config.wiremockBaseUrl);
    const manifest = createWireMockAuthManifest(config.wiremockBaseUrl);

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
