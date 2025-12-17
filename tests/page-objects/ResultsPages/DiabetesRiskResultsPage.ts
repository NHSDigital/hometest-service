import { type Locator, type Page } from '@playwright/test';
import { HTCPage } from '../HTCPage';
import { pageTitlesMap, RoutePath } from '../../route-paths';

export class DiabetesResultsPage extends HTCPage {
  readonly pageHeader: Locator;
  readonly backLink: Locator;
  readonly riskLevel: Locator;
  readonly riskDescription: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator('h1:has-text("Diabetes results")');
    this.backLink = page.locator('a:has-text("Back")');
    this.riskLevel = page.locator('span.nhsuk-heading-l.nhsuk-u-margin-top-3');
    this.riskDescription = page.locator('.nhsuk-inset-text p').nth(0);
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async getRiskLevel(): Promise<string> {
    return (await this.riskLevel.textContent()) ?? '';
  }

  async getRiskDescription(): Promise<string> {
    return (await this.riskDescription.textContent()) ?? '';
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.DiabetesRiskResultsPage];
  }
}
