import { mergeTests } from '@playwright/test';
import { pageObjectFixture } from './PageObjectsFixture';
import { configurationFixture } from './ConfigurationFixture';
import { apiFixture } from './ApiFixture';
import { accessibilityFixture } from './AccessibilityFixture';
import { storageStateFixture } from './StorageStateFixture';
import { consoleErrorFixture } from './ConsoleErrorFixture';

export const test = mergeTests(
  pageObjectFixture,
  configurationFixture,
  apiFixture,
  accessibilityFixture,
  storageStateFixture,
  consoleErrorFixture);
