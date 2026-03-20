import { mergeTests, test, type Page } from "@playwright/test";
import type { NHSLoginMockedUser } from "../utils/users/BaseUser";
import { SpecialUserKey } from "../utils/users/SpecialUserKey";
import { createWireMockUserInfoMapping } from "../utils/users/wiremockUserInfoMapping";
import { userManagementFixture } from "./storageStateFixture";
import { configurationFixture } from "./configurationFixture";
import { wiremockFixture } from "./wiremockFixture";

type RandomUserFixtures = {
  loginUser: (page: Page, key?: SpecialUserKey) => Promise<NHSLoginMockedUser>;
};

const base = mergeTests(userManagementFixture, configurationFixture, wiremockFixture);

export const randomUserFixture = base.extend<RandomUserFixtures>({
  loginUser: async ({ userManager, config, wiremock }, use) => {
    await use(async (page: Page, key: SpecialUserKey = SpecialUserKey.RANDOM): Promise<NHSLoginMockedUser> => {
      const user = userManager.getSpecialUser(key) as NHSLoginMockedUser;
      const { title, parallelIndex } = test.info();
      console.log(`[Worker ${parallelIndex}][${title}] Logging in user NHS number: ${user.nhsNumber}`);

      if (config.useWiremockAuth) {
        await wiremock.createMapping(createWireMockUserInfoMapping(user));
      }

      await userManager.login(user, page);

      return user;
    });
  },
});
