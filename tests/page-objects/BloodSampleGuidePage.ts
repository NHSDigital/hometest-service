import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class BloodSampleGuidePage extends BasePage {

  constructor(page: Page) {

    super(page);
  }
}
