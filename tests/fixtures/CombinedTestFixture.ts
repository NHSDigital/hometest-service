import { accessibilityFixture } from "./accessibilityFixture";
import { apiFixture } from "./apiFixture";
import { configurationFixture } from "./configurationFixture";
import { consoleErrorFixture } from "./consoleErrorFixture";
import { mergeTests } from "@playwright/test";
import { pageObjectFixture } from "./pageObjectsFixture";
import { storageStateFixture } from "./storageStateFixture";
import { wiremockFixture } from "./wiremockFixture";

export const test = mergeTests(
  pageObjectFixture,
  configurationFixture,
  apiFixture,
  accessibilityFixture,
  storageStateFixture,
  consoleErrorFixture,
  wiremockFixture,
);
