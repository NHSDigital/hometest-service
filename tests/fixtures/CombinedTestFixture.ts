import { mergeTests } from "@playwright/test";

import { dbFixture } from "./DbFixture";
import { accessibilityAutoFixture } from "./accessibilityAutoFixture";
import { accessibilityFixture } from "./accessibilityFixture";
import { apiFixture } from "./apiFixture";
import { configurationFixture } from "./configurationFixture";
import { consoleErrorFixture } from "./consoleErrorFixture";
import { logContextFixture } from "./logContextFixture";
import { pageObjectFixture } from "./pageObjectsFixture";
import { storageStateFixture } from "./storageStateFixture";
import { wiremockFixture } from "./wiremockFixture";

export const test = mergeTests(
  pageObjectFixture,
  configurationFixture,
  apiFixture,
  dbFixture,
  accessibilityFixture,
  accessibilityAutoFixture,
  logContextFixture,
  storageStateFixture,
  consoleErrorFixture,
  wiremockFixture,
);
