import { test as base } from "@playwright/test";
import { UserApi } from "../api/clients/UserApi";
import { HIVResultsApiResource } from "../api/clients/HIVResultsApiResource";
import { OrderApiResource } from "../api/clients/OrderApiResource";
import { OrderStatusApiResource } from "../api/clients/OrderStatusApiResource";

type ApiFixtures = {
  userApi: UserApi;
  hivResultsApi: HIVResultsApiResource;
  orderApi: OrderApiResource;
  orderStatusApi: OrderStatusApiResource;
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
  orderStatusApi: async ({ request }, use) => {
    const orderStatusApi = new OrderStatusApiResource(request);
    await use(orderStatusApi);
  },
});
