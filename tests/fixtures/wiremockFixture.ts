import { test as base } from "@playwright/test";

import { WireMockClient } from "../api/clients/WireMockClient";
import { ConfigFactory } from "../configuration/EnvironmentConfiguration";

type WireMockFixtures = {
  wiremock: WireMockClient;
};

export const wiremockFixture = base.extend<WireMockFixtures>({
  wiremock: async ({}, use) => {
    const client = new WireMockClient(ConfigFactory.getConfig().wiremockBaseUrl);
    await use(client);
    await client.deleteAllCreatedMappings();
  },
});
