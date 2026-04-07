import { mergeTests } from "@playwright/test";

import { dbFixture } from "./DbFixture";
import { apiFixture } from "./apiFixture";
import { configurationFixture } from "./configurationFixture";
import { logContextFixture } from "./logContextFixture";

export const test = mergeTests(configurationFixture, apiFixture, dbFixture, logContextFixture);
export { expect } from "@playwright/test";
