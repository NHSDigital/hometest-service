import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";

test(
  "Suppliers Privacy Policy Page",
  {
    tag: ["@accessibility"],
  },
  async ({ suppliersPrivacyPolicyPage, accessibility, loginUser, context, page }) => {
    await context.clearCookies();
    await context.clearPermissions();
    await loginUser(page);
    await suppliersPrivacyPolicyPage.navigate("SH:24");
    await suppliersPrivacyPolicyPage.waitUntilPageLoaded();

    const accessErrors = await accessibility.runAccessibilityCheck(
      suppliersPrivacyPolicyPage.page,
      "Suppliers Privacy Policy Page",
    );
    expect(accessErrors).toHaveLength(0);
  },
);
