import { Locator, Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CannotUseServiceUnder18Page extends BasePage {
  readonly findAnotherClinicLink: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);

    this.findAnotherClinicLink = page.locator("a", {
      hasText: "Find another sexual health clinic",
    });
    this.pageHeader = page.locator("h1", {
      hasText: "You cannot use this service as you are under 18",
    });
  }

  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }

  async expectPostcodeInFindAnotherClinicLink(postcode: string): Promise<void> {
    const compactPostcode = postcode.replaceAll(/\s+/g, "");
    const encodedOriginalPostcode = encodeURIComponent(postcode);

    await expect(this.findAnotherClinicLink).toHaveAttribute(
      "href",
      new RegExp(`location=(${compactPostcode}|${encodedOriginalPostcode})`),
    );
  }
}
