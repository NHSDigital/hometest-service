import { Locator, Page } from '@playwright/test';
import { ConfigFactory, type ConfigInterface } from '../configuration/configuration';
import { BasePage } from './BasePage';

export class PrivacyPolicyPage extends BasePage {
  readonly makeAComplaintLink: Locator;


  constructor(page: Page) {
    super(page);
    this.makeAComplaintLink = page.getByRole('link', { name: 'make a complainthttps://ico.org.uk/make-a-complaint/' });
  }

  async clickMakeAComplaintLink(): Promise<void> {
    await this.makeAComplaintLink.click();
  }




}
