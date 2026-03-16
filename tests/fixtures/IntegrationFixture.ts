import { apiFixture } from "./apiFixture";
import { configurationFixture } from "./configurationFixture";
import { dbFixture } from "./dbFixture";
import { mergeTests } from "@playwright/test";

export const test = mergeTests(configurationFixture, apiFixture, dbFixture);
export { expect } from "@playwright/test";
