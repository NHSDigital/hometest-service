import { mergeTests, type Page } from "@playwright/test";
import type { NHSLoginMockedUser } from "../utils/users/BaseUser";
import { SpecialUserKey } from "../utils/users/SpecialUserKey";
import { createWireMockUserInfoMapping } from "../utils/users/wiremockUserInfoMapping";
import { storageStateFixture } from "./storageStateFixture";
import { configurationFixture } from "./configurationFixture";
import { wiremockFixture } from "./wiremockFixture";

type RandomUserFixtures = {
  loginAsRandomUser: (page: Page) => Promise<NHSLoginMockedUser>;
};

const base = mergeTests(storageStateFixture, configurationFixture, wiremockFixture);

export const randomUserFixture = base.extend<RandomUserFixtures>({
  loginAsRandomUser: async ({ userManager, config, wiremock }, use) => {
    await use(async (page: Page): Promise<NHSLoginMockedUser> => {
      const user = userManager.getSpecialUser(SpecialUserKey.RANDOM) as NHSLoginMockedUser;

      if (config.useWiremockAuth) {
        await wiremock.createMapping(createWireMockUserInfoMapping(user));
      }

      await userManager.login(user, page);

      return user;
    });
  },
});
