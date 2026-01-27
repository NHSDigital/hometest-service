import { test as base } from '@playwright/test';
import { Configuration, config } from '../configuration';

type ConfigurationFixtures = {
  config: Configuration;
};

export const configurationFixture = base.extend<ConfigurationFixtures>({
  config: async ({}, use) => {
    await use(config);
  },
});
