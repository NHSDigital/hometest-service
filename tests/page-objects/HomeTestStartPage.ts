import { Page, Locator } from '@playwright/test';
import { config, EnvironmentVariables } from '../configuration';

export class HomeTestStartPage {
  readonly page: Page;
  readonly headerText: Locator;
  readonly findClinicLink: Locator;
  readonly nearestAELink: Locator;
  readonly nearestSexualHealthClinicLink: Locator;
  readonly learnMoreHIVAidsLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headerText = page.locator('h1');
    this.findClinicLink = page.getByRole('link', { name: 'Find a sexual health clinic' });
    this.nearestAELink = page.getByRole('link', { name: 'your nearest A&E' });
    this.nearestSexualHealthClinicLink = page.getByRole('link', { name: /your nearest sexual health/ });
    this.learnMoreHIVAidsLink = page.getByRole('link', { name: 'Learn more about HIV and AIDS' });
  }
  async navigate(): Promise<void> {
    await this.page.goto(config.get(EnvironmentVariables.UI_BASE_URL));
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async waitForPageLoaded(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');

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

}
