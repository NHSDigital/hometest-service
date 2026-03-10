import { Locator, Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CannotUseServiceUnder18Page extends BasePage {
  readonly findAnotherClinicLink: Locator;

  constructor(page: Page) {
    super(page);

    this.findAnotherClinicLink = page.locator("a", {
      hasText: "Find another sexual health clinic",
    });
  }

  async expectPostcodeInFindAnotherClinicLink(postcode: string): Promise<void> {
    const encodedPostcode = encodeURIComponent(postcode);

    await expect(this.findAnotherClinicLink).toHaveAttribute(
      "href",
      new RegExp(`location=${encodedPostcode}`),
    );
  }
}
