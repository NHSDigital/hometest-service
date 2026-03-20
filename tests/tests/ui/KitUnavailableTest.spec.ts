import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";

test.describe(
  "Home Test Unavailable page",
  {
    tag: ["@ui"],
  },
  () => {
    test.use({
      errorCaptureOptions: {
        failOnNetworkError: false,
        failOnConsoleError: false,
      },
    });

    const normalize = (value: string): string => {
      const decoded = decodeURIComponent(value).replace(/\+/g, " ");
      return decoded.replace(/[^a-z0-9]/gi, "").toLowerCase();
    };

    const isPostcodePresentInUrl = (href: string, baseUrl: string, postcode: string): boolean => {
      const url = new URL(href, baseUrl);
      const expected = normalize(postcode);

      return (
        normalize(url.toString()).includes(expected) ||
        [...url.searchParams.values()].some((value) => normalize(value).includes(expected))
      );
    };

    test("should include postcode in Find another sexual health clinic link", async ({
      homeTestStartPage,
      enterDeliveryAddressPage,
      selectDeliveryAddressPage,
      kitNotAvailableInYourAreaPage,
      loginUser,
      context,
      page,
    }) => {

      await loginUser(page);
      const unavailablePostcode = "SW1A 1AA";

      await homeTestStartPage.navigate();
      await homeTestStartPage.clickStartNowButton();
      await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue({
        addressLine1: "",
        addressLine2: "",
        townCity: "",
        postCode: unavailablePostcode,
      });
      await selectDeliveryAddressPage.waitUntilPageLoaded();
      await selectDeliveryAddressPage.selectAddressAndContinue();
      await kitNotAvailableInYourAreaPage.waitUntilPageLoaded();

      const href = await kitNotAvailableInYourAreaPage.getFindAnotherSexualHealthClinicLinkUrl();
      expect(
        isPostcodePresentInUrl(href, kitNotAvailableInYourAreaPage.page.url(), unavailablePostcode),
      ).toBe(true);
    });
  },
);
