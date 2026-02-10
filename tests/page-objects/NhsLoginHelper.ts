import { type Page } from '@playwright/test';
import { ConfigFactory, type ConfigInterface } from '../configuration/configuration';
import type { NHSLoginUser } from '../utils/users/BaseUser';
import { NHSEmailAndPasswordPage } from './NHSLogin/NHSEmailAndPasswordPage';
import { CodeSecurityPage } from './NHSLogin/CodeSecurityPage';


export default class NhsLoginHelper {

    readonly config: ConfigInterface;
    constructor() {
        this.config = ConfigFactory.getConfig();
    }

  public async fillNhsLoginFormsAndWaitForStartPage(
    nhsLoginUser: NHSLoginUser,
    page: Page
  ): Promise<void> {
    const loginPage = new NHSEmailAndPasswordPage(page);
    const codeSecurityPage = new CodeSecurityPage(page);
    await page.goto(`${this.config.uiBaseUrl}`);  
    await loginPage.fillAuthFormWithCredentialsAndClickContinue(nhsLoginUser);
    await codeSecurityPage.fillAuthOneTimePasswordAndClickContinue(
      nhsLoginUser.otp
    );
    await page.waitForURL('**/get-self-test-kit-for-HIV');
  }

  public async loginNhsUser(page: Page, user: NHSLoginUser): Promise<Page> {
    
  await this.fillNhsLoginFormsAndWaitForStartPage(user, page);
    return page;
  }
}
