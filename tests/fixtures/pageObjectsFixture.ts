import { test as base } from '@playwright/test';
import { HomeTestPage, PlaywrightDevPage } from '../page-objects';

export interface MyFixtures {
  homeTestPage: HomeTestPage;
  playwrightDevPage: PlaywrightDevPage;
}

export const pageObjectFixture  = base.extend<MyFixtures>({
  homeTestPage: async ({ page }, use) => {
    await use(new HomeTestPage(page));
  },
  playwrightDevPage: async ({ page }, use) => {
    await use(new PlaywrightDevPage(page));
  },
});


