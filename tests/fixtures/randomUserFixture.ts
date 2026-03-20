import { mergeTests, test, type Page } from "@playwright/test";
import type { NHSLoginMockedUser } from "../utils/users/BaseUser";
import { SpecialUserKey } from "../utils/users/SpecialUserKey";
import { createWireMockUserInfoMapping } from "../utils/users/wiremockUserInfoMapping";
import { userManagementFixture } from "./storageStateFixture";
import { configurationFixture } from "./configurationFixture";
import { wiremockFixture } from "./wiremockFixture";

type LoginUserResult = {
  user: NHSLoginMockedUser;
  mappingId: string | undefined;
};

type RandomUserFixtures = {
  loginUser: (page: Page, key?: SpecialUserKey) => Promise<LoginUserResult>;
};

const base = mergeTests(userManagementFixture, configurationFixture, wiremockFixture);

export const randomUserFixture = base.extend<RandomUserFixtures>({
  loginUser: async ({ userManager, config, wiremock }, use) => {
    await use(async (page: Page, key: SpecialUserKey = SpecialUserKey.RANDOM): Promise<LoginUserResult> => {
      const user = userManager.getSpecialUser(key) as NHSLoginMockedUser;
      const { title, parallelIndex } = test.info();
      console.log(`[Worker ${parallelIndex}][${title}] Logging in user NHS number: ${user.nhsNumber} + DOB: ${user.dob}`);

      let mappingId: string | undefined;
      if (config.useWiremockAuth) {
        mappingId = await wiremock.createMapping(createWireMockUserInfoMapping(user));
      }

      page.on("response", async (response) => {
        if (response.url().includes("session")) {
          try {
            const body = await response.text();
            console.log(`[Worker ${parallelIndex}][${title}] Session body: ${body}`);
          } catch {
            // ignore
          }
        }
      });

      await userManager.login(user, page);
      return { user, mappingId };
    });
  },
});
