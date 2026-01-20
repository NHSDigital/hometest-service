import { mergeTests } from '@playwright/test';
import { pageObjectFixture } from './pageObjectsFixture';

export const test = mergeTests(
  pageObjectFixture
);
export { expect } from '@playwright/test';
