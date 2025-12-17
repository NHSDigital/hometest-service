import { type Locator, type Page } from '@playwright/test';
import { pageTitlesMap, RoutePath } from '../../route-paths';
import { HTCPage } from '../HTCPage';
import { ConfigFactory, type Config } from '../../env/config';

export class MainResultsPage extends HTCPage {
  readonly pageHeader: Locator;

  readonly heartAgeHeader: Locator;
  readonly heartAgeDetailsParagraph: Locator;
  readonly cvdRiskDetailsParagraph: Locator;
  readonly cvdRiskCategory: Locator;
  readonly bmiCard: Locator;
  readonly bmiValueText: Locator;
  readonly bmiCategoryText: Locator;
  readonly bloodPressureCard: Locator;
  readonly bloodPressureValueText: Locator;
  readonly bloodPressureCategoryText: Locator;
  readonly diabetesCard: Locator;
  readonly diabetesValueText: Locator;
  readonly diabetesClassificationText: Locator;
  readonly dementiaLink: Locator;
  readonly cholesterolCard: Locator;
  readonly cholesterolValueText: Locator;
  readonly cholesterolClassificationText: Locator;
  readonly missingCholesterolCard: Locator;
  readonly missingCholesterolCardTitle: Locator;
  readonly missingCholesterolCardText: Locator;
  readonly missingCholesterolCardLink: Locator;
  readonly incompleteResultsTitle: Locator;
  readonly alcoholCard: Locator;
  readonly alcoholUseValueText: Locator;
  readonly alcoholClassificationText: Locator;
  readonly physicalActivityCard: Locator;
  readonly physicalActivityValueText: Locator;
  readonly physicalActivityCategoryText: Locator;
  readonly smokingCard: Locator;
  readonly smokingStatusText: Locator;
  readonly currentAgeValue: Locator;

  readonly config: Config;

  constructor(page: Page) {
    super(page);
    this.config = ConfigFactory.getConfig();

    this.pageHeader = page.locator('h1:has-text("Hello")');

    // heart age card
    this.heartAgeHeader = page.locator(
      '.app-card__hero h2 .app-card__heading-big-number'
    );
    this.heartAgeDetailsParagraph = page.locator('//p[@id="heartAgeDetails"]');

    // cvd card
    this.cvdRiskDetailsParagraph = page.locator(
      '//span[contains(@class, "cvdRiskScoreValue")]'
    );
    this.cvdRiskCategory = page.locator('.nhsuk-inset-text > p');

    // bmi card
    this.bmiCard = page.locator('#bmi-card');
    this.bmiValueText = this.bmiCard.locator('.card-value');
    this.bmiCategoryText = this.bmiCard.locator('.card-details-value');

    this.currentAgeValue = page.locator('p:has-text("Your age is:") > span');

    this.bloodPressureCard = page.locator('#blood-pressure-card');
    this.bloodPressureValueText = this.bloodPressureCard.locator('.card-value');
    this.bloodPressureCategoryText = this.bloodPressureCard.locator(
      '.card-details-value'
    );

    this.diabetesCard = page.locator('#diabetes-card');
    this.diabetesValueText = this.diabetesCard.locator('.card-value');
    this.diabetesClassificationText = this.diabetesCard.locator(
      '.card-details-value'
    );

    this.cholesterolCard = page.locator('#cholesterol-card');
    this.cholesterolValueText = this.cholesterolCard.locator('.card-value');
    this.cholesterolClassificationText = this.cholesterolCard.locator(
      '.card-details-value'
    );

    this.missingCholesterolCard = page.getByTestId(
      'missing-results-cholesterol'
    );
    this.missingCholesterolCardTitle =
      this.missingCholesterolCard.locator('h3');
    this.missingCholesterolCardText = this.missingCholesterolCard.locator(
      '.nhsuk-card__description'
    );
    this.missingCholesterolCardLink =
      this.missingCholesterolCard.locator('.nhsuk-card__link');

    this.incompleteResultsTitle = page.getByText('Incomplete result');

    this.alcoholCard = page.locator('#alcohol-card');
    this.alcoholUseValueText = this.alcoholCard.locator('.card-value');
    this.alcoholClassificationText = this.alcoholCard.locator(
      '.card-details-value'
    );

    this.physicalActivityCard = page.locator('#physical-activity-card');
    this.physicalActivityCategoryText = this.physicalActivityCard.locator(
      '.card-details-value'
    );

    this.smokingCard = page.locator('#smoking-card');
    this.smokingStatusText = this.smokingCard.locator('.card-value');
    // dementia
    this.dementiaLink = page.locator(
      `a.nhsuk-card__link[href="${RoutePath.DementiaPage}"]`
    );
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.MainResultsPage];
  }

  async goToMainResultsPageAndWaitForLoading(): Promise<void> {
    await this.page.goto(`${this.config.questionnaireAppURL}/results-summary`);
    await this.waitUntilLoaded();
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async clickBloodPressureLink(): Promise<void> {
    await this.bloodPressureCard.click();
  }

  async clickDiabetesLink(): Promise<void> {
    await this.diabetesCard.click();
  }

  async clickDementiaLink(): Promise<void> {
    await this.dementiaLink.click();
  }

  async clickBmiLink(): Promise<void> {
    await this.bmiCard.click();
  }

  async clickSmokingLink(): Promise<void> {
    await this.smokingCard.click();
  }

  async clickCholesterolLink(): Promise<void> {
    await this.cholesterolCard.click();
  }

  async clickMissingCholesterolLink(): Promise<void> {
    await this.missingCholesterolCardLink.click();
  }

  async clickAlcoholLink(): Promise<void> {
    await this.alcoholCard.click();
  }

  async clickPhysicalActivityLink(): Promise<void> {
    await this.physicalActivityCard.click();
  }

  async getHeaderText(): Promise<string | null> {
    return await this.pageHeader.textContent();
  }

  getHeartAgeHeaderValueText(): Locator {
    return this.heartAgeHeader;
  }

  getHeartAgeDetailsParagraph(): Locator {
    return this.heartAgeDetailsParagraph;
  }

  getCvdRiskParagraph(): Locator {
    return this.cvdRiskDetailsParagraph;
  }

  getBmiValue(): Locator {
    return this.bmiValueText;
  }

  getBmiCategory(): Locator {
    return this.bmiCategoryText;
  }

  getBloodPressureValue(): Locator {
    return this.bloodPressureValueText;
  }

  getBloodPressureCategoryText(): Locator {
    return this.bloodPressureCategoryText;
  }

  getAlcoholUseValueText(): Locator {
    return this.alcoholUseValueText;
  }

  getAlcoholClassificationText(): Locator {
    return this.alcoholClassificationText;
  }

  getPhysicalActivityValueText(): Locator {
    return this.physicalActivityValueText;
  }

  getPhysicalActivityCategoryText(): Locator {
    return this.physicalActivityCategoryText;
  }

  getSmokingStatusValue(): Locator {
    return this.smokingStatusText;
  }

  async refreshPage(): Promise<void> {
    await this.page.reload();
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(new Error('Back link not supported on this page'));
  }
}
