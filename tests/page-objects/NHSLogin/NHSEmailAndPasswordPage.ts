import { type Locator, type Page } from "@playwright/test";

import type { NHSLoginUser } from "../../utils/users";
import { BasePage } from "../BasePage";

export class NHSEmailAndPasswordPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly errMsg: Locator;
  readonly continueBtn: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = this.page.locator("input#user-email");
    this.passwordInput = this.page.locator("input#password-input");
    this.errMsg = this.page.locator(".nhsuk-error-message");
    this.continueBtn = this.page.locator('button:has-text("Continue")');
    this.pageHeader = this.page.locator('h1:has-text("Enter your email address")');
  }

  async fillAuthFormWithCredentialsAndClickContinue(nhsLoginUser: NHSLoginUser): Promise<void> {
    await this.emailInput.waitFor();
    await this.emailInput.fill(nhsLoginUser.email);
    await this.passwordInput.fill(nhsLoginUser.password);
    await this.continueBtn.click();
  }

  async waitUntilPageLoaded(): Promise<void> {
    await this.emailInput.waitFor();
  }
}
