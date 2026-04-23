import { Locator, Page } from "@playwright/test";

import { AuthenticatedPage } from "./AuthenticatedPage";

export class GetSelfTestKitPage extends AuthenticatedPage {
  readonly findClinicLink: Locator;
  readonly nearestAELink: Locator;
  readonly sexualHealthServicesLink: Locator;
  readonly learnMoreHIVAidsLink: Locator;
  readonly startNowBtn: Locator;
  readonly privacyPolicyLink: Locator;
  readonly bloodSampleGuideLink: Locator;
  readonly termsOfUseLink: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.findClinicLink = page.getByRole("link", {
      name: "Find a sexual health clinic",
    });
    this.nearestAELink = page.getByRole("link", { name: "your nearest A&E" });
    this.sexualHealthServicesLink = page.getByRole("link", {
      name: "find sexual health services near you",
    });
    this.learnMoreHIVAidsLink = page.getByRole("link", {
      name: "Learn more about HIV and AIDS",
    });
    this.startNowBtn = page.getByRole("button", { name: "Start now" });
    this.bloodSampleGuideLink = page.getByRole("link", {
      name: "Blood sample step-by-step guide",
    });
    this.privacyPolicyLink = page.getByRole("link", { name: "privacy policy" });
    this.termsOfUseLink = page.getByRole("link", { name: "terms of use" });
    this.pageHeader = page.getByRole("heading", {
      name: "Order a free HIV self-test kit",
      level: 1,
    });
  }

  async waitUntilPageLoaded(): Promise<void> {
    await this.pageHeader.waitFor({ state: "visible" });
  }

  async clickFindClinicLink(expectedUrl: string): Promise<void> {
    await this.findClinicLink.click();
    await this.page.waitForURL(expectedUrl);
  }

  async clickNearestAELink(expectedUrl: string): Promise<void> {
    await this.nearestAELink.click();
    await this.page.waitForURL(expectedUrl);
  }

  async clickSexualHealthServicesLink(expectedUrl: string): Promise<void> {
    await this.sexualHealthServicesLink.click();
    await this.page.waitForURL(expectedUrl);
  }

  async clickLearnMoreHIVAidsLink(expectedUrl: string): Promise<void> {
    await this.learnMoreHIVAidsLink.click();
    await this.page.waitForURL(expectedUrl);
  }

  async clickStartNowButton(): Promise<void> {
    await this.waitUntilPageLoaded();
    await this.startNowBtn.click();
  }

  async clickPrivacyPolicyLink(): Promise<void> {
    await this.privacyPolicyLink.click();
  }

  async clickBloodSampleGuideLink(): Promise<void> {
    await this.bloodSampleGuideLink.click();
  }

  async clickTermsOfUseLink(): Promise<void> {
    await this.termsOfUseLink.click();
  }
}
