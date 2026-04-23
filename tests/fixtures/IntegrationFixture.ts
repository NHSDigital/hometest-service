import { mergeTests } from "@playwright/test";

import { dbFixture } from "./DbFixture";
import { apiFixture } from "./apiFixture";
import { configurationFixture } from "./configurationFixture";
import { lambdaFixture } from "./lambdaFixture";
import { logContextFixture } from "./logContextFixture";

export const test = mergeTests(
  configurationFixture,
  apiFixture,
  dbFixture,
  lambdaFixture,
  logContextFixture,
);
export { expect } from "@playwright/test";
