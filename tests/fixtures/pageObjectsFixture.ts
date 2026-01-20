import { test as base } from '@playwright/test';
import { WPHomePage, PlaywrightDevPage } from '../page-objects';

type PageObjectFixtures = {
  wpHomePage: WPHomePage;
  playwrightDevPage: PlaywrightDevPage;
};

// Extend base test with page object fixtures
export const pageObjectFixture = base.extend<PageObjectFixtures>({
  wpHomePage: async ({ page }, use) => {
    const wpHomePage = new WPHomePage(page);
    await use(wpHomePage);
  },

  playwrightDevPage: async ({ page }, use) => {
    const playwrightDevPage = new PlaywrightDevPage(page);
    await use(playwrightDevPage);
  },
});
