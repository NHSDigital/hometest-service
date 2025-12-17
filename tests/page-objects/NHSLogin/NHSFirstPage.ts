import { type Locator, type Page } from '@playwright/test';
import { ConfigFactory, type Config } from '../../env/config';
import { pageTitlesMap } from '../../../ui/src/lib/models/route-paths';
import { RoutePath } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import type { UrlParameterType } from '../../lib/enum/url-parameter-type';

export class NHSFirstPage extends HTCPage {
  readonly getStartedBtn: Locator;
  readonly config: Config;

  constructor(page: Page) {
    super(page);
    this.getStartedBtn = page.locator(
      'button:has-text("Log in or open NHS App")'
    );
    this.config = ConfigFactory.getConfig();
  }

  async goToTheQuestionnaireAppURL(): Promise<void> {
    await this.page.goto(`${this.config.questionnaireAppURL}/`);
  }

  async clickContinueBtn(): Promise<void> {
    await this.getStartedBtn.click();
  }

  async goToTheQuestionnaireAppUrlAndClickContinue(): Promise<void> {
    await this.goToTheQuestionnaireAppURL();
    await this.clickContinueBtn();
  }

  async goToTheQuestionnaireAppWithUrlParameterAndClickContinue(
    urlParameter?: UrlParameterType
  ): Promise<void> {
    const url = `${this.config.questionnaireAppURL}/?s=`;
    const urlWithParams =
      urlParameter !== undefined && urlParameter !== null
        ? `${url}${urlParameter}`
        : url;
    await this.page.goto(urlWithParams);
    await this.clickContinueBtn();
  }

  async goToTheQuestionnaireAppURLWithLoginMock(
    mockCode: string
  ): Promise<void> {
    await this.page.goto(
      `${this.config.questionnaireAppURL}/sso?assertedLoginIdentity=${mockCode}`
    );
  }

  async goToTheQuestionnaireAppURLWithLoginMockAndInviteParameter(
    mockCode: string,
    parameter: string
  ): Promise<void> {
    await this.page.goto(
      `${this.config.questionnaireAppURL}/sso?assertedLoginIdentity=${mockCode}&s=${parameter}`
    );
  }

  async goToTheFaultyAssertedLoginIdentityURL(): Promise<void> {
    await this.page.goto(
      `${this.config.questionnaireAppURL}/sso?assertedLoginIdentity=faultyone`
    );
  }

  async goToTheNHSLoginCallbackURLWithInvalidCode(): Promise<void> {
    await this.page.goto(
      `${this.config.questionnaireAppURL}/login-callback?code=wrong_code`
    );
  }

  async waitUntilLoaded(): Promise<void> {
    await this.getStartedBtn.waitFor();
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(new Error('Back link is not supported on this page'));
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.StartHealthCheckPage];
  }
}
