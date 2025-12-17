import { type Locator, type Page } from '@playwright/test';
import { HTCPage } from '../HTCPage';
import { pageTitlesMap, RoutePath } from '../../route-paths';

export class AlcoholResultsPage extends HTCPage {
  readonly pageHeader: Locator;
  readonly backLink: Locator;
  readonly alcoholRiskParagraph: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator('h1:has-text("Alcohol risk results")');
    this.backLink = page.locator('a:has-text("Back")');
    this.alcoholRiskParagraph = page.locator('#risk-level');
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async geRiskLevel(): Promise<string> {
    return (await this.alcoholRiskParagraph.textContent()) ?? '';
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.AlcoholResultsPage];
  }
}
