import { test as base } from "@playwright/test";
import { UserApi } from "../api/clients/UserApi";
import { HIVResultsApiResource } from "../api/clients/HIVResultsApiResource";
import { OrderApiResource } from "../api/clients/OrderApiResource";

type ApiFixtures = {
  userApi: UserApi;
  hivResultsApi: HIVResultsApiResource;
  orderApi: OrderApiResource;
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
  orderApi: async ({ request }, use) => {
    const orderApi = new OrderApiResource(request);
    await use(orderApi);
  },
});
