import { test as base } from '@playwright/test';
import { UserApi } from '../api/clients';

type ApiFixtures = {
  userApi: UserApi;
};

export const apiFixture = base.extend<ApiFixtures>({
  userApi: async ({ request }, use) => {
    const userApi = new UserApi(request);
    await use(userApi);
  },
});
