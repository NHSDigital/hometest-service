import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { PersonalDetailsModel } from "../models/PersonalDetails";

export class OrderSubmittedPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }


}
