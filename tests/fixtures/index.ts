import { mergeTests } from '@playwright/test';
import { pageObjectFixture } from './pageObjectsFixture';
import { configurationFixture } from './configurationFixture';
import { apiFixture } from './apiFixture';
import { accessibilityFixture } from './accessibilityFixture';
import { storageStateFixture } from './storageStateFixture';
import { consoleErrorFixture } from './consoleErrorFixture';

export const test = mergeTests(
  pageObjectFixture,
  configurationFixture,
  apiFixture,
  accessibilityFixture,
  storageStateFixture,
  consoleErrorFixture);
export { expect } from '@playwright/test';
