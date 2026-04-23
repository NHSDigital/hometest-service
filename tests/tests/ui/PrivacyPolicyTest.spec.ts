import { expect } from "@playwright/test";

import { test } from "../../fixtures/CombinedTestFixture";

const makeAComplaintUrl = "https://ico.org.uk/make-a-complaint/";

test.describe("Privacy Policy page", { tag: "@ui" }, () => {
  test("should display the privacy policy and open the ICO complaint page in a new tab", async ({
    beforeYouStartPage,
    getSelfTestKitPage,
    privacyPolicyPage,
  }) => {
    await beforeYouStartPage.navigate();
    await beforeYouStartPage.clickContinueToOrderKitButton();
    await expect(getSelfTestKitPage.headerText).toHaveText("Order a free HIV self-test kit");
    await getSelfTestKitPage.clickPrivacyPolicyLink();
    const actualHeaderText = await privacyPolicyPage.getHeaderText();
    expect(actualHeaderText).toBe("Hometest Privacy Policy - Draft v1.0 Jan 2026");
    await expect(privacyPolicyPage.makeAComplaintLink).toHaveAttribute("href", makeAComplaintUrl);
  });
});
