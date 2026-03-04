import { test as base } from '@playwright/test';
import { ConfigFactory, type ConfigInterface } from '../configuration/EnvironmentConfiguration';

type ConfigurationFixtures = {
  config: ConfigInterface;
};

export const configurationFixture = base.extend<ConfigurationFixtures>({
  config: async ({}, use) => {
    await use(ConfigFactory.getConfig());
  }
});
