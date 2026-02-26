import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
export class PrivacyPolicyPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }
}
