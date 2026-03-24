import { FullConfig } from "@playwright/test";
import { WireMockClient } from "./api/clients/WireMockClient";
import { ConfigFactory } from "./configuration/EnvironmentConfiguration";
import { cleanupWireMockAuthState } from "./utils/users/wiremockAuthMappings";

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Global teardown started");
  console.log(`Completed tests in ${config.projects.length} project(s)`);

  const testConfig = ConfigFactory.getConfig();

  if (testConfig.useWiremockAuth) {
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
}

export default globalTeardown;
