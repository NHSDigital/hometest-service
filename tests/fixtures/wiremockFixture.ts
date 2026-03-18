import { test as base } from "@playwright/test";
import { WireMockClient } from "../api/clients/WireMockClient";

type WireMockFixtures = {
  wiremock: WireMockClient;
};

export const wiremockFixture = base.extend<WireMockFixtures>({
  wiremock: async ({}, use) => {
    const client = new WireMockClient();
    await use(client);
    await client.deleteAllCreatedMappings();
  },
});
