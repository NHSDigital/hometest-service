import { type Locator, type Page } from '@playwright/test';
import { ConfigFactory, type Config } from '../../env/config';
import { pageTitlesMap, RoutePath } from '../../route-paths';
import { HTCPage } from '../HTCPage';

export class HealthCheckVersionMigrationPage extends HTCPage {
  readonly pageHeader: Locator;
  readonly config: Config;
  readonly iHaveReadAndAcceptTheVersionChange: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator(
      'h1:has-text("Your NHS Health Check online is incomplete")'
    );
    this.config = ConfigFactory.getConfig();
    this.iHaveReadAndAcceptTheVersionChange = page.locator(
      '#update-health-check-version-1'
    );
    this.continueButton = page.locator('button:has-text("Continue")');
  }

  async waitUntilLoaded(): Promise<void> {
    await this.iHaveReadAndAcceptTheVersionChange.waitFor();
  }

  async getHeaderText(): Promise<string | null> {
    return await this.pageHeader.textContent();
  }

  async checkIHaveReadAndAcceptTheVersionMigrationBox(): Promise<void> {
    await this.iHaveReadAndAcceptTheVersionChange.check();
  }

  async clickContinueButton(): Promise<void> {
    await this.continueButton.click();
  }

  async checkAcceptBoxAndClickContinueButton(): Promise<void> {
    await this.checkIHaveReadAndAcceptTheVersionMigrationBox();
    await this.clickContinueButton();
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(new Error('Method not implemented.'));
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.HealthCheckVersionMigration];
  }
}
