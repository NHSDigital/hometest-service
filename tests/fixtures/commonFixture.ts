import { mergeTests } from '@playwright/test';
import { storageStateFixture } from './storageStateFixture';
import { awsServicesFixture } from './awsServicesFixture';
import { pageObjectFixture } from './pageObjectsFixture';
import { configurationFixture } from './configurationFixture';
import { apiResourceFixture } from './apiResourceFixture';

export const test = mergeTests(
  pageObjectFixture,
  storageStateFixture,
  awsServicesFixture,
  configurationFixture,
  apiResourceFixture
);
export { expect } from '@playwright/test';
