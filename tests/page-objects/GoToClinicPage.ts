import { Locator, Page } from "@playwright/test";
import { ConfigFactory, type ConfigInterface } from "../configuration/EnvironmentConfiguration";
import { BasePage } from "./BasePage";

export class GoToClinicPage extends BasePage {
  readonly config: ConfigInterface;
  readonly findAnotherSexualHealthClinicLink: Locator;
  readonly learnMoreHIVAidsLink: Locator;

  constructor(page: Page) {
    super(page);
    this.config = ConfigFactory.getConfig();
    this.findAnotherSexualHealthClinicLink = page.getByRole("link", {
      name: "Find another sexual health clinic",
    });
    this.learnMoreHIVAidsLink = page.getByRole("link", {
      name: "Learn more about HIV and AIDS",
    });
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
