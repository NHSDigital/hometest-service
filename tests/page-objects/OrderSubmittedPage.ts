import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class OrderSubmittedPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }
}
