import { expect } from "@playwright/test";

import { test } from "../../fixtures/CombinedTestFixture";

const makeAComplaintUrl = "https://ico.org.uk/make-a-complaint/";

test.describe("Privacy Policy page", { tag: "@ui" }, () => {
  test("should display the privacy policy and open the ICO complaint page in a new tab", async ({
    homeTestStartPage,
    privacyPolicyPage,
    context,
  }) => {
    await homeTestStartPage.navigate();
    await expect(homeTestStartPage.headerText).toHaveText("Get a self-test kit for HIV");
    await homeTestStartPage.clickPrivacyPolicyLink();
    const actualHeaderText = await privacyPolicyPage.getHeaderText();
    expect(actualHeaderText).toBe("Hometest Privacy Policy - Draft v1.0 Jan 2026");
    const [newTab] = await Promise.all([
      context.waitForEvent("page"),
      privacyPolicyPage.clickMakeAComplaintLink(),
    ]);
    await newTab.waitForLoadState();
    expect(newTab.url()).toBe(makeAComplaintUrl);
  });
});
