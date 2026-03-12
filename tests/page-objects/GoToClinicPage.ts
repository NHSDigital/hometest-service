import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class GoToClinicPage extends BasePage {
  readonly pageHeader: Locator;
  readonly findAnotherSexualHealthClinicLink: Locator;
  readonly learnMoreHIVAidsLink: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.getByRole("heading", {
      name: "Go to a sexual health clinic",
      level: 1,
    });
    this.findAnotherSexualHealthClinicLink = page.getByRole("link", {
      name: "Find another sexual health clinic",
    });
    this.learnMoreHIVAidsLink = page.getByRole("link", {
      name: "Learn more about HIV and AIDS",
    });
  }

  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }

  async clickFindAnotherSexualHealthClinicLink(): Promise<void> {
    await this.findAnotherSexualHealthClinicLink.click();
  }

  async getFindAnotherSexualHealthClinicLinkUrl(): Promise<string> {
    const href = await this.findAnotherSexualHealthClinicLink.getAttribute("href");
    return href ?? "";
  }

  async clickLearnMoreHIVAidsLink(expectedUrl: string): Promise<Page> {
    const popupPromise = this.page.waitForEvent("popup");
    await this.learnMoreHIVAidsLink.click();
    const popup = await popupPromise;
    await popup.waitForURL(expectedUrl);
    return popup;
  }
}
