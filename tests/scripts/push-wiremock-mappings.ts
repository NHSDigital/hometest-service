#!/usr/bin/env node
/**
 * Push all baseline WireMock mappings to a running WireMock instance.
 *
 * Resets existing mappings first, then pushes:
 *   - NHS Login auth stubs (JWKS, /authorize, /token, /userinfo)
 *   - Supplier stubs (OAuth token, order placement)
 *   - OS Places postcode-lookup stub (wildcard catch-all)
 *
 * Usage:
 *   WIREMOCK_BASE_URL=https://wiremock-uat.poc.hometest.service.nhs.uk \
 *   npx tsx scripts/push-wiremock-mappings.ts
 *
 * Or via the npm script:
 *   WIREMOCK_BASE_URL=https://wiremock-uat.poc.hometest.service.nhs.uk \
 *   npm run wiremock:push
 *
 * Environment variables:
 *   WIREMOCK_BASE_URL  Base URL of the WireMock instance (default: http://localhost:8080).
 *                      Also used as the JWT issuer so tokens match what the login-lambda expects.
 */
import { WireMockClient } from "../api/clients/WireMockClient";
import type { WireMockMapping } from "../api/clients/WireMockClient";
import {
  cleanupWireMockAuthState,
  configureWireMockAuthMappings,
  createWireMockAuthManifest,
  createWireMockCatchAllAuthorizeMapping,
  getWireMockAuthManifestPath,
} from "../utils/users/wiremockAuthMappings";
import { createWireMockUserInfoMapping } from "../utils/users/wiremockUserInfoMapping";
import { createSupplierOAuthTokenMapping } from "../utils/wireMockMappings/SupplierOAuthWireMockMappings";
import { createSupplierOrderSuccessMapping } from "../utils/wireMockMappings/SupplierOrderWireMockMappings";

const wiremockBaseUrl = process.env.WIREMOCK_BASE_URL ?? "http://localhost:8080";

/** Catch-all OS Places /find stub — returns a single dummy address for any postcode query. */
function createOSPlacesCatchAllMapping(): WireMockMapping {
  return {
    priority: 100, // lower priority than per-test stubs
    request: {
      method: "GET",
      urlPath: "/find",
      queryParameters: {
        query: { matches: ".*" },
      },
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

async function main(): Promise<void> {
  console.log(`Pushing WireMock mappings to: ${wiremockBaseUrl}`);

  const wiremock = new WireMockClient(wiremockBaseUrl);

  // Generate fresh RSA key pairs + JWTs for all default test users.
  // The issued JWTs use wiremockBaseUrl as the issuer so they match what
  // the login-lambda validates against (NHS_LOGIN_BASE_ENDPOINT_URL).
  cleanupWireMockAuthState();
  const manifest = createWireMockAuthManifest(wiremockBaseUrl);

  // Reset + push NHS Login OAuth stubs (JWKS, /authorize redirects, /token exchanges)
  await configureWireMockAuthMappings(wiremock, manifest);

  // Push /userinfo stubs per user
  const allUsers = [...manifest.workerUsers, ...Object.values(manifest.specialUsers)];
  for (const user of allUsers) {
    await wiremock.createMapping(
      createWireMockUserInfoMapping(
        user,
        user.authContext.accessToken,
        user.authContext.sub,
        wiremockBaseUrl,
      ),
    );
  }

  // Catch-all /authorize fallback for real browser navigation (no login_hint sent).
  // Uses the first worker user so a manual visit to the site completes the auth flow.
  await wiremock.createMapping(createWireMockCatchAllAuthorizeMapping(manifest.workerUsers[0]));

  // Push static supplier stubs
  await wiremock.createMapping(createSupplierOAuthTokenMapping());
  await wiremock.createMapping(createSupplierOrderSuccessMapping());

  // Push catch-all OS Places postcode lookup stub
  await wiremock.createMapping(createOSPlacesCatchAllMapping());

  console.log(
    `✅ Pushed mappings: ${allUsers.length} users (auth + userinfo), supplier stubs, OS Places catch-all`,
  );
  console.log(`   Auth manifest: ${getWireMockAuthManifestPath()}`);
  console.log(`   JWT issuer:    ${wiremockBaseUrl}`);
}

main().catch((err: unknown) => {
  console.error("❌ Failed to push WireMock mappings:", err);
  process.exit(1);
});
