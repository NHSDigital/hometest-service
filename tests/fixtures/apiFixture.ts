import { test as base } from "@playwright/test";
import { HIVResultsApiResource } from "../api/clients/HIVResultsApiResource";
import { OrderApiResource } from "../api/clients/OrderApiResource";

type ApiFixtures = {
  hivResultsApi: HIVResultsApiResource;
  orderApi: OrderApiResource;
};

export const apiFixture = base.extend<ApiFixtures>({
  hivResultsApi: async ({ request }, use) => {
    const hivResultsApi = new HIVResultsApiResource(request);
    await use(hivResultsApi);
  },
  orderApi: async ({ request }, use) => {
    const orderApi = new OrderApiResource(request);
    await use(orderApi);
  },
});
