import { test as base } from '@playwright/test';
import { WPHomePage, PlaywrightDevPage, LoginPage, FindAddressPage } from '../page-objects';
import { BasePage } from '../page-objects/basePage';

type PageObjectFixtures = {
  wpHomePage: WPHomePage;
  playwrightDevPage: PlaywrightDevPage;
  loginPage: LoginPage;
  basePage: BasePage;
  findAddressPage: FindAddressPage;
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
