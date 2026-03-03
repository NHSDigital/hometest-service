import { accessibilityFixture } from './AccessibilityFixture';
import { apiFixture } from './ApiFixture';
import { configurationFixture } from './ConfigurationFixture';
import { consoleErrorFixture } from './ConsoleErrorFixture';
import { mergeTests } from '@playwright/test';
import { pageObjectFixture } from './PageObjectsFixture';
import { storageStateFixture } from './StorageStateFixture';

export const test = mergeTests(
  pageObjectFixture,
  configurationFixture,
  apiFixture,
  accessibilityFixture,
  storageStateFixture,
  consoleErrorFixture,
);
