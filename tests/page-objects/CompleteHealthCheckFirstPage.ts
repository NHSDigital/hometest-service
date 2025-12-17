import { type Locator, type Page } from '@playwright/test';
import { ConfigFactory, type Config } from '../env/config';
import { pageTitlesMap, RoutePath } from '../route-paths';
import { HTCPage } from './HTCPage';

export class CompleteHealthCheckFirstPage extends HTCPage {
  readonly startNowBtn: Locator;
  readonly startHealthCheckPageHeader: Locator;
  readonly config: Config;
  readonly aboutThisSoftwareLink: Locator;

  constructor(page: Page) {
    super(page);
    this.startNowBtn = page.locator('button:has-text("Start now")');
    this.startHealthCheckPageHeader = page.locator('h1');
    this.aboutThisSoftwareLink = page.locator(
      'a:has-text("About this software")'
    );
    this.config = ConfigFactory.getConfig();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.page.waitForSelector('button:has-text("Start now")');
  }

  async goToCompleteHealthCheckFirstPageAndWaitForLoading(): Promise<void> {
    await this.page.goto(this.config.questionnaireAppURL + '/start');
    await this.waitUntilLoaded();
  }

  async getHeaderText(): Promise<string | null> {
    return await this.startHealthCheckPageHeader.textContent();
  }

  async clickStartNowBtn(): Promise<void> {
    await this.startNowBtn.click();
  }

  async clickAboutThisSoftwareLink(): Promise<void> {
    await this.aboutThisSoftwareLink.click();
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(new Error('Method not implemented.'));
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.StartHealthCheckPage];
  }
}
