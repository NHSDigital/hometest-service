import { mergeTests } from '@playwright/test';
import { pageObjectFixture } from './pageObjectsFixture';
import { configurationFixture } from './configurationFixture';
import { apiFixture } from './apiFixture';
import { accessibilityFixture } from './accessibilityFixture';

export const test = mergeTests(
  pageObjectFixture,
  configurationFixture,
  apiFixture,
  accessibilityFixture);
export { expect } from '@playwright/test';

