import { type Locator, type Page } from '@playwright/test';
import { HTCPage } from '../HTCPage';
import { pageTitlesMap, RoutePath } from '../../route-paths';

export class SmokingResultsPage extends HTCPage {
  readonly pageHeader: Locator;
  readonly backLink: Locator;
  static readonly waitUntilLoaded: Locator;
  readonly smokeRiskParagraph: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator('h1:has-text("Smoking results")');
    this.backLink = page.locator('a:has-text("Back")');
    this.smokeRiskParagraph = page.locator('h2.nhsuk-card__heading');
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async getRiskLevel(): Promise<string> {
    return (await this.smokeRiskParagraph.textContent()) ?? '';
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.SmokingResultsPage];
  }
}
