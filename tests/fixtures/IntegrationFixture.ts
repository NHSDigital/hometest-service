import { mergeTests } from '@playwright/test';
import { configurationFixture } from './ConfigurationFixture';
import { apiFixture } from './ApiFixture';
import { dbFixture } from './DbFixture';

export const test = mergeTests(
  configurationFixture,
  apiFixture,
  dbFixture,
);
export { expect } from '@playwright/test';
