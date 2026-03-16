import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";

test(
  "Suppliers Privacy Policy Page",
  {
    tag: ["@accessibility"],
  },
  async ({ suppliersPrivacyPolicyPage, accessibility }) => {
    await suppliersPrivacyPolicyPage.navigate("SH:24");
    await suppliersPrivacyPolicyPage.waitUntilPageLoaded();

    const accessErrors = await accessibility.runAccessibilityCheck(
      suppliersPrivacyPolicyPage.page,
      "Suppliers Privacy Policy Page",
    );
    expect(accessErrors).toHaveLength(0);
  },
);
