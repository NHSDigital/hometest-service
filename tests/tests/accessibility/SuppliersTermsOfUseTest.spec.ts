import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";

test(
  "Suppliers Terms and Conditions Page",
  {
    tag: ["@accessibility"],
  },
  async ({ suppliersTermsOfUsePage, accessibility }) => {
    await suppliersTermsOfUsePage.navigateToSuppliersTerms("SH:24");
    await suppliersTermsOfUsePage.waitUntilPageLoad();

    const accessErrors = await accessibility.runAccessibilityCheck(
      suppliersTermsOfUsePage.page,
      "Suppliers Terms and Conditions Page",
    );
    expect(accessErrors).toHaveLength(0);
  },
);
