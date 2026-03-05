import { expect, Locator, Page } from "@playwright/test";
import { EnvironmentVariables } from "../configuration/EnvironmentVariables";
import { BasePage } from "./BasePage";

export class KitNotAvailableInYourAreaPage extends BasePage {
  readonly page: Page;
  readonly findAnotherSexualHealthClinicLink: Locator;

  private readonly pagePath = "/get-self-test-kit-for-HIV/kit-not-available-in-your-area";

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.findAnotherSexualHealthClinicLink = page.getByRole("link", {
      name: "Find another sexual health clinic",
    });
  }

  async navigate(config: { get: (key: EnvironmentVariables) => string }): Promise<void> {
    const baseUrl = config.get(EnvironmentVariables.UI_BASE_URL);
    await this.page.goto(`${baseUrl}${this.pagePath}`);
  }

  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`${this.pagePath}$`));
  }

  async clickFindAnotherSexualHealthClinicAndOpenNewTab(): Promise<Page> {
    const [newTab] = await Promise.all([
      this.page.context().waitForEvent("page"),
      this.findAnotherSexualHealthClinicLink.click(),
    ]);
    await newTab.waitForLoadState("domcontentloaded");
    return newTab;
  }

  async assertFindAnotherSexualHealthClinicLinkContainsPostcode(postcode: string): Promise<void> {
    const href = await this.findAnotherSexualHealthClinicLink.getAttribute("href");
    expect(href).toBeTruthy();

    const url = new URL(href!, this.page.url());
    const expected = postcode.replace(/\s+/g, "").toLowerCase();

    const isPostcodePresentInUrl =
      url.toString().replace(/\s+/g, "").toLowerCase().includes(expected) ||
      [...url.searchParams.values()].some((value) =>
        value.replace(/\s+/g, "").toLowerCase().includes(expected),
      );

    expect(isPostcodePresentInUrl).toBe(true);
  }
}
