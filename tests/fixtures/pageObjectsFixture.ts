import { test as base } from '@playwright/test';
import { WPHomePage, PlaywrightDevPage, LoginPage,BasePage } from '../page-objects';

type PageObjectFixtures = {
  wpHomePage: WPHomePage;
  playwrightDevPage: PlaywrightDevPage;
  loginPage: LoginPage;
  basePage: BasePage;
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

  loginPage: async({ page}, use) => {
    const loginPage = new LoginPage(page);
        await use(loginPage);


  }
});
