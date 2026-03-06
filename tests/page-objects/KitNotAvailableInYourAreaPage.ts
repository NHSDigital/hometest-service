import { Locator, Page } from "@playwright/test";

import { BasePage } from "./BasePage";

export class KitNotAvailableInYourAreaPage extends BasePage {
  readonly findAnotherSexualHealthClinicLink: Locator;

  constructor(page: Page) {
    super(page);
    this.findAnotherSexualHealthClinicLink = page.getByRole("link", {
      name: "Find another sexual health clinic",
    });
  }

  async getFindAnotherSexualHealthClinicLinkUrl(): Promise<string> {
    const href = await this.findAnotherSexualHealthClinicLink.getAttribute("href");

    if (!href) {
      throw new Error("Find another sexual health clinic link does not have an href");
    }

    return href;
  }
}
