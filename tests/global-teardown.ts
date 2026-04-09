import { FullConfig } from "@playwright/test";

import { WireMockClient } from "./api/clients/WireMockClient";
import { AuthType, ConfigFactory } from "./configuration/EnvironmentConfiguration";
import { SCANNED_URLS_FILE } from "./fixtures/accessibilityAutoFixture";
import { cleanupWireMockAuthState } from "./utils/users/wiremockAuthMappings";

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Global teardown started");
  console.log(`Completed tests in ${config.projects.length} project(s)`);

  const testConfig = ConfigFactory.getConfig();

  if (testConfig.authType === AuthType.WIREMOCK) {
    const wiremock = new WireMockClient(testConfig.wiremockBaseUrl);

    try {
      await wiremock.resetAllMappings();
      cleanupWireMockAuthState();
      console.log("✅ Restored static WireMock mappings");
    } catch (error) {
      console.error("❌ Failed to restore static WireMock mappings", error);
      throw error;
    }
  }

  console.log("✅ Global teardown completed");

  try {
    const fs = await import("node:fs");

    const scanned: string[] = JSON.parse(fs.readFileSync(SCANNED_URLS_FILE, "utf8"));
    console.log(`♿ Accessibility scanned ${scanned.length} unique URL(s) across all workers.`);
  } catch {
    // Non-fatal — do not block teardown if summary generation fails.
  }
}

export default globalTeardown;
