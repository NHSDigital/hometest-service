import { type Locator, type Page } from '@playwright/test';
import { HTCPage } from '../HTCPage';
import { pageTitlesMap, RoutePath } from '../../route-paths';

export class PhysicalActivityResultsPage extends HTCPage {
  readonly pageHeader: Locator;
  readonly backLink: Locator;
  readonly physicalActivityRiskHeading: Locator;
  readonly physicalActivityRiskDescription: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator('h1:has-text("Physical activity results")');
    this.backLink = page.locator('a:has-text("Back")');
    this.physicalActivityRiskHeading = page.locator(
      'h2:has-text("Your physical activity level is")'
    );
    this.physicalActivityRiskDescription = page.locator('p#risk-level');
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.PhysicalActivityResultsPage];
  }

  async geRiskLevel(): Promise<string | null> {
    return await this.physicalActivityRiskHeading.textContent();
  }

  async getRiskLevelDescription(): Promise<string | null> {
    return await this.physicalActivityRiskDescription.textContent();
  }
}
