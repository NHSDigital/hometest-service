import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";

test(
  "Home test start page",
  {
    tag: ["@accessibility"],
  },
  async ({ homeTestStartPage, accessibility, loginUser, context, page }) => {

    await loginUser(page);
    await homeTestStartPage.navigate();
    await homeTestStartPage.waitUntilPageLoaded();
    const accessErrors = await accessibility.runAccessibilityCheck(
      homeTestStartPage,
      "Home Test Start Page",
    );
    expect(accessErrors).toHaveLength(0);
  },
);
