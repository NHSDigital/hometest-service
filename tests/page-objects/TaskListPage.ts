import { type Locator, type Page } from '@playwright/test';
import { ConfigFactory, type Config } from '../env/config';
import { pageTitlesMap, RoutePath } from '../route-paths';
import { HTCPage } from './HTCPage';
export class TaskListPage extends HTCPage {
  readonly checkYourPressureLink: Locator;
  readonly aboutYouLink: Locator;
  readonly physicalActivityLink: Locator;
  readonly alcoholConsumptionLink: Locator;
  readonly enterBodyMeasurementsLink: Locator;
  readonly reviewAndSubmitLink: Locator;
  readonly pageHeader: Locator;
  readonly config: Config;
  readonly eligibilityStatus: Locator;
  readonly readDeclarationStatus: Locator;
  readonly yourBloodPressureStatus: Locator;
  readonly aboutYouStatus: Locator;
  readonly physicalActivityStatus: Locator;
  readonly alcoholConsumptionStatus: Locator;
  readonly enterBodyMeasurementsStatus: Locator;
  readonly reviewAndSubmitStatus: Locator;
  readonly orderABloodTestKitStatus: Locator;
  orderABloodTestKitLink: Locator;
  readonly timeReminderInfo: Locator;

  constructor(page: Page) {
    super(page);
    this.config = ConfigFactory.getConfig();
    this.checkYourPressureLink = page.getByRole('link', {
      name: 'Check your blood pressure'
    });
    this.aboutYouLink = page.getByRole('link', { name: 'About you' });
    this.physicalActivityLink = page.getByRole('link', {
      name: 'Physical activity'
    });
    this.alcoholConsumptionLink = page.getByRole('link', {
      name: 'Alcohol consumption'
    });
    this.enterBodyMeasurementsLink = page.getByRole('link', {
      name: 'Enter body measurements'
    });
    this.reviewAndSubmitLink = page.getByRole('link', {
      name: 'Review and submit'
    });
    this.orderABloodTestKitLink = page.getByRole('link', {
      name: 'Order a blood test kit'
    });
    this.pageHeader = page.locator('h1').getByText('NHS Health Check');
    this.timeReminderInfo = page
      .locator('p[aria-hidden="true"]')
      .getByText('You have until');
    this.eligibilityStatus = page.locator('#Checkeligibility-status');
    this.readDeclarationStatus = page.locator('#Readdeclaration-status');
    this.yourBloodPressureStatus = page.locator(
      '#Checkyourbloodpressure-status'
    );
    this.aboutYouStatus = page.locator('#Aboutyou-status');
    this.physicalActivityStatus = page.locator('#Physicalactivity-status');
    this.alcoholConsumptionStatus = page.locator('#Alcoholconsumption-status');
    this.enterBodyMeasurementsStatus = page.locator(
      '#Enterbodymeasurements-status'
    );
    this.reviewAndSubmitStatus = page.locator('#Reviewandsubmit-status');
    this.orderABloodTestKitStatus = page.locator('#Orderabloodtestkit-status');
  }

  async waitUntilLoaded(): Promise<void> {
    await this.pageHeader.waitFor();
  }

  async getHeaderText(): Promise<string | null> {
    return await this.pageHeader.textContent();
  }

  async goToTaskListPage(): Promise<void> {
    await this.page.goto(`${this.config.questionnaireAppURL}/task-list`);
  }

  async goToTaskListPageAndWaitForLoading(): Promise<void> {
    await this.goToTaskListPage();
    await this.waitUntilLoaded();
  }

  async clickCheckYourPressureLink(): Promise<void> {
    await this.checkYourPressureLink.click();
  }

  async clickAboutYouLink(): Promise<void> {
    await this.aboutYouLink.click();
  }

  async clickPhysicalActivityLink(): Promise<void> {
    await this.physicalActivityLink.click();
  }

  async clickAlcoholConsumptionLink(): Promise<void> {
    await this.alcoholConsumptionLink.click();
  }

  async clickEnterBodyMeasurementsLink(): Promise<void> {
    await this.enterBodyMeasurementsLink.click();
  }

  async clickReviewAndSubmitLink(): Promise<void> {
    await this.reviewAndSubmitLink.click();
  }

  async clickOrderABloodTestKitLink(): Promise<void> {
    await this.orderABloodTestKitLink.click();
  }

  async clickBackLink(): Promise<void> {
    return Promise.reject(new Error('Back link is not supported on this page'));
  }

  getExpectedTitleHeading(): string {
    return pageTitlesMap[RoutePath.TaskListPage];
  }
}
