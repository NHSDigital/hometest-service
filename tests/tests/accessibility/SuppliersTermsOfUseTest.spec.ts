import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";

test(
  "Suppliers Terms and Conditions Page",
  {
    tag: ["@accessibility"],
  },
  async ({ suppliersTermsOfUsePage, accessibility }) => {
    await suppliersTermsOfUsePage.navigate("SH:24");
    await suppliersTermsOfUsePage.waitUntilPageLoaded();

    const accessErrors = await accessibility.runAccessibilityCheck(
      suppliersTermsOfUsePage.page,
      "Suppliers Terms and Conditions Page",
    );
    expect(accessErrors).toHaveLength(0);
  },
);
