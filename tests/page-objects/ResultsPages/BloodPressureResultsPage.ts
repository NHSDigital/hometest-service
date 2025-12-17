import { type Locator, type Page } from '@playwright/test';
import { HTCPage } from '../HTCPage';
import { pageTitlesMap, RoutePath } from '../../route-paths';

export class BloodPressureResultsPage extends HTCPage {
  readonly pageHeader: Locator;
  readonly backLink: Locator;
  readonly bloodPressureRiskHeading: Locator;
  readonly bloodPressureRiskDescription: Locator;
  readonly bloodPressureHighRiskDescription: Locator;

  constructor(page: Page) {
    super(page);
    this.backLink = page.locator('a:has-text("Back")');
    this.pageHeader = page.locator('h1:has-text("Blood pressure results")');
    this.bloodPressureRiskHeading = page.locator(
      'h2.nhsuk-card__heading:has-text("Your blood pressure is:")'
    );
    this.bloodPressureRiskDescription = page.locator(
      'p:has-text("Your blood pressure reading is")'
    );
    this.bloodPressureHighRiskDescription = page.locator(
      'p:has-text("This is high blood pressure")'
    );
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.BloodPressureResultsPage];
  }

  getRiskLevel(): Locator {
    return this.bloodPressureRiskHeading;
  }

  getRiskLevelDescription(): Locator {
    return this.bloodPressureRiskDescription;
  }

  getHighRiskDescription(): Locator {
    return this.bloodPressureHighRiskDescription;
  }
}
