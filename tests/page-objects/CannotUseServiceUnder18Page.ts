import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CannotUseServiceUnder18Page extends BasePage {
  constructor(page: Page) {
    super(page);
  }
}
