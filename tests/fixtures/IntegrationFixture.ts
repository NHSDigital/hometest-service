import { apiFixture } from "./ApiFixture";
import { configurationFixture } from "./ConfigurationFixture";
import { dbFixture } from "./DbFixture";
import { mergeTests } from "@playwright/test";

export const test = mergeTests(configurationFixture, apiFixture, dbFixture);
export { expect } from "@playwright/test";
