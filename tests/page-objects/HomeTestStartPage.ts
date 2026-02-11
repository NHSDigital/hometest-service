import { Locator, Page} from '@playwright/test';
import { ConfigFactory, type ConfigInterface } from '../configuration/configuration';
import { BasePage } from './BasePage';

export class HomeTestStartPage extends BasePage {
  readonly config: ConfigInterface;
  readonly headerText: Locator;
  readonly findClinicLink: Locator;
  readonly nearestAELink: Locator;
  readonly nearestSexualHealthClinicLink: Locator;
  readonly learnMoreHIVAidsLink: Locator;
  readonly startNowBtn: Locator;


  constructor(page: Page) {
    super(page);
    this.headerText = page.locator('h1');
    this.findClinicLink = page.getByRole('link', { name: 'Find a sexual health clinic' });
    this.nearestAELink = page.getByRole('link', { name: 'your nearest A&E' });
    this.nearestSexualHealthClinicLink = page.getByRole('link', { name: /your nearest sexual health/ });
    this.learnMoreHIVAidsLink = page.getByRole('link', { name: 'Learn more about HIV and AIDS' });
    this.startNowBtn = page.getByRole('button', { name: 'Start now' });
    this.config = ConfigFactory.getConfig();

  }
  async navigate(): Promise<void> {
    await this.page.goto(`${this.config.uiBaseUrl}/get-self-test-kit-for-HIV`);

  }

  async getHeaderText(): Promise<string> {
    return await this.headerText.textContent() ?? "";
  }

  async clickFindClinicLink(expectedUrl: string): Promise<void> {
    await this.findClinicLink.click();
    await this.page.waitForURL(expectedUrl);
  }

  async clickNearestAELink(expectedUrl: string): Promise<void> {
    await this.nearestAELink.click();
    await this.page.waitForURL(expectedUrl);
  }

  async clickNearestSexualHealthClinicLink(expectedUrl: string): Promise<void> {
    await this.nearestSexualHealthClinicLink.click();
    await this.page.waitForURL(expectedUrl);
  }

  async clickLearnMoreHIVAidsLink(expectedUrl: string): Promise<void> {
    await this.learnMoreHIVAidsLink.click();
    await this.page.waitForURL(expectedUrl);
  }

  async clickStartNowButton(): Promise<void> {
    await this.startNowBtn.click();
  }
}
