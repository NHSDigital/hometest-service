import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";

test(
  "Blood sample guide page",
  {
    tag: ["@accessibility"],
  },
  async ({ homeTestStartPage, bloodSampleGuidePage, accessibility }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickBloodSampleGuideLink();
    await bloodSampleGuidePage.waitUntilPageLoaded();
    const accessErrors = await accessibility.runAccessibilityCheck(
      bloodSampleGuidePage.page,
      "Blood Sample Guide Page",
    );
    expect(accessErrors).toHaveLength(0);
  },
);
