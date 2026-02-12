import { test as base } from "@playwright/test";
import { UserApi } from "../api/clients/UserApi";
import { HIVResultsApiResource } from "../api/clients/HIVResultsApiResource";

type ApiFixtures = {
  userApi: UserApi;
  hivResultsApi: HIVResultsApiResource;
};

export const apiFixture = base.extend<ApiFixtures>({
  userApi: async ({ request }, use) => {
    const userApi = new UserApi(request);
    await use(userApi);
  },
  hivResultsApi: async ({ request }, use) => {
    const hivResultsApi = new HIVResultsApiResource(request);
    await use(hivResultsApi);
  },
});
