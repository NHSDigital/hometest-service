import { type Locator, type Page } from '@playwright/test';
import { HTCPage } from '../HTCPage';
import { pageTitlesMap, RoutePath } from '../../route-paths';

export class CholesterolResultsPage extends HTCPage {
  readonly pageHeader: Locator;
  readonly backLink: Locator;
  readonly riskLevel: Locator;
  readonly incompleteCholesterolResultsCard: Locator;
  readonly incompleteCholesterolResultsCardTitle: Locator;
  readonly totalCholesterolUnknownCard: Locator;
  readonly ratioUnknownCard: Locator;
  readonly hdlUnknownCard: Locator;
  readonly totalCard: Locator;
  readonly ratioCard: Locator;
  readonly goodHDLCard: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator('h1:has-text("Cholesterol results")');
    this.backLink = page.locator('a:has-text("Back")');
    this.riskLevel = page.locator('span.nhsuk-heading-l.nhsuk-u-margin-top-3');
    this.incompleteCholesterolResultsCard = page.getByTestId(
      'incomplete-cholesterol-results-card'
    );
    this.incompleteCholesterolResultsCardTitle =
      this.incompleteCholesterolResultsCard.locator('h2');
    this.totalCholesterolUnknownCard = page.getByTestId(
      'total-cholesterol-unknown-card'
    );
    this.ratioUnknownCard = page.getByTestId('ratio-unknown-card');
    this.hdlUnknownCard = page.getByTestId('hdl-unknown-card');
    this.totalCard = page.getByTestId('total-cholesterol-card');
    this.goodHDLCard = page.getByTestId('goodl-hdl-cholesterol-card');
    this.ratioCard = page.getByTestId('total-hdl-cholesterol-card');
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

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.CholesterolResultsPage];
  }

  async getIncompleteCholesterolResultsCardTitle(): Promise<string | null> {
    return await this.incompleteCholesterolResultsCardTitle.textContent();
  }
}
