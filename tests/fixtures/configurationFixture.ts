import { ConfigFactory, type Config } from '../env/config';
import { test as base } from '@playwright/test';

export interface ConfigurationFixture {
  config: Config;
}

export const configurationFixture = base.extend<ConfigurationFixture>({
  config: async ({}, use) => {
    await use(ConfigFactory.getConfig());
  }
});
