import { type Locator, type Page } from '@playwright/test';
import { pageTitlesMap, RoutePath } from '../route-paths';
import { HTCPage } from './HTCPage';
import { ConfigFactory, type Config } from '../env/config';

export class HealthCheckExpiredPage extends HTCPage {
  readonly config: Config;
  readonly healthCheckExpiredPageHeader: Locator;
  readonly expectedFeedbackSubtitle: Locator;
  readonly giveFeedbackButton: Locator;

  constructor(page: Page) {
    super(page);
    this.config = ConfigFactory.getConfig();
    this.healthCheckExpiredPageHeader = page.locator(
      'h1:has-text("Book a face-to-face appointment with your GP surgery")'
    );
    this.giveFeedbackButton = page.getByRole('button', {
      name: 'Give feedback'
    });
    this.expectedFeedbackSubtitle = page.getByRole('heading', {
      name: 'Help us improve this service'
    });
  }

  async waitUntilLoaded(): Promise<void> {
    await this.healthCheckExpiredPageHeader.waitFor();
  }

  async getHeaderText(): Promise<string | null> {
    return await this.healthCheckExpiredPageHeader.textContent();
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(new Error('Method not implemented.'));
  }

  async clickFeedbackButton(): Promise<void> {
    await this.giveFeedbackButton.click();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.HealthCheckExpiredPage];
  }

  async goToPageAndWaitForLoading(): Promise<void> {
    await this.page.goto(
      `${this.config.questionnaireAppURL}/data-expired-exit`
    );
    await this.waitUntilLoaded();
  }
}
