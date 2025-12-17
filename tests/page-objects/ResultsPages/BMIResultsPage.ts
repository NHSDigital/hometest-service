import { type Locator, type Page } from '@playwright/test';
import { HTCPage } from '../HTCPage';
import { pageTitlesMap, RoutePath } from '../../route-paths';

export class BMIResultsPage extends HTCPage {
  readonly pageHeader: Locator;
  readonly backLink: Locator;
  readonly bmiScore: Locator;
  readonly bmiCategoryText: Locator;
  readonly bmiColor: Locator;
  readonly beMoreActiveLink: Locator;
  readonly healthyRecipesLink: Locator;
  readonly treatmentObesityLink: Locator;
  readonly loseWeightLink: Locator;
  readonly gainWeightLink: Locator;
  readonly healthyEatingLoseWeightLink: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator(
      'h1:has-text("Body mass index (BMI) results")'
    );
    this.backLink = page.locator('a:has-text("Back")');
    this.bmiScore = page.locator('.app-card__heading-big-number');
    this.bmiCategoryText = page.locator('.nhsuk-inset-text p');
    this.beMoreActiveLink = page.getByRole('link', {
      name: 'How to be more active - NHS'
    });
    this.healthyRecipesLink = page.getByRole('link', {
      name: 'Healthy recipes - NHS'
    });
    this.treatmentObesityLink = page.getByRole('link', {
      name: 'Find out about treatment and'
    });
    this.loseWeightLink = page.getByRole('link', {
      name: 'NHS Better Health - Lose'
    });
    this.gainWeightLink = page.getByRole('link', {
      name: 'Healthy ways to gain weight'
    });
    this.healthyEatingLoseWeightLink = page.getByRole('link', {
      name: 'Healthy eating when trying to'
    });
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async getBmiScore(): Promise<string | null> {
    await this.bmiScore.waitFor();
    return await this.bmiScore.textContent();
  }

  async clickBackLink(): Promise<void> {
    await this.backLink.click();
  }

  async clickBeMoreActiveLink(): Promise<void> {
    await this.beMoreActiveLink.click();
  }

  async clickHealthyRecipesLink(): Promise<void> {
    await this.healthyRecipesLink.click();
  }

  async clickTreatmentObesityLink(): Promise<void> {
    await this.treatmentObesityLink.click();
  }

  async clickLoseWeightLink(): Promise<void> {
    await this.loseWeightLink.click();
  }

  async clickGainWeightLink(): Promise<void> {
    await this.gainWeightLink.click();
  }

  async clickHealthyEatingLoseWeightLink(): Promise<void> {
    await this.healthyEatingLoseWeightLink.click();
  }

  async checkLinksObese(): Promise<void> {
    await this.beMoreActiveLink.click();
    await this.healthyRecipesLink.click();
    await this.treatmentObesityLink.click();
    await this.loseWeightLink.click();
  }

  async checkLinksOverweight(): Promise<void> {
    await this.healthyEatingLoseWeightLink.click();
    await this.loseWeightLink.click();
    await this.beMoreActiveLink.click();
    await this.healthyRecipesLink.click();
  }

  async checkLinksHealthy(): Promise<void> {
    await this.beMoreActiveLink.click();
    await this.healthyRecipesLink.click();
  }

  async checkLinksUnderweight(): Promise<void> {
    await this.beMoreActiveLink.click();
    await this.gainWeightLink.click();
  }

  async getBmiCategoryText(): Promise<string> {
    await this.bmiCategoryText.waitFor();
    const bmiCategoryText = await this.bmiCategoryText.textContent();
    return bmiCategoryText ?? ' ';
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.BMIResultsPage];
  }
}
