import { accessibilityFixture } from "./accessibilityFixture";
import { apiFixture } from "./apiFixture";
import { configurationFixture } from "./configurationFixture";
import { consoleErrorFixture } from "./consoleErrorFixture";
import { mergeTests } from "@playwright/test";
import { pageObjectFixture } from "./pageObjectsFixture";
import { randomUserFixture } from "./randomUserFixture";
import { storageStateFixture } from "./storageStateFixture";
import { wiremockFixture } from "./wiremockFixture";
import { ConfigFactory } from "../configuration/EnvironmentConfiguration";

const useWiremockAuth = ConfigFactory.getConfig().useWiremockAuth;

export const test = useWiremockAuth
  ? mergeTests(
      pageObjectFixture,
      configurationFixture,
      apiFixture,
      accessibilityFixture,
      consoleErrorFixture,
      wiremockFixture,
      randomUserFixture,
    )
  : mergeTests(
      pageObjectFixture,
      configurationFixture,
      apiFixture,
      accessibilityFixture,
      storageStateFixture,
      consoleErrorFixture,
      wiremockFixture,
      randomUserFixture,
    );
