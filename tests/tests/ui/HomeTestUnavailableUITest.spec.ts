import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";

test.describe("Home Test Unavailable page", () => {
  test.use({
    errorCaptureOptions: {
      failOnNetworkError: false, // Don't fail on network errors to allow assertions on the page content
      failOnConsoleError: false, // Don't fail on console errors to allow assertions on the page content
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
    findAddressPage,
    selectDeliveryAddressPage,
    kitNotAvailableInYourAreaPage,
  }) => {
    const unavailablePostcode = "SW1A 1AA";

    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await findAddressPage.fillPostCodeAndContinue({
      addressLine1: "",
      addressLine2: "",
      townCity: "",
      postCode: unavailablePostcode,
    });
    await selectDeliveryAddressPage.waitUntilPageLoad();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await kitNotAvailableInYourAreaPage.waitUntilPageLoad();

    const href = await kitNotAvailableInYourAreaPage.getFindAnotherSexualHealthClinicLinkUrl();
    expect(
      isPostcodePresentInUrl(href, kitNotAvailableInYourAreaPage.page.url(), unavailablePostcode),
    ).toBe(true);
  });
});
