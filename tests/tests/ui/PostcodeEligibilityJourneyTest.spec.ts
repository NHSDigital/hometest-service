import { test } from "../../fixtures/CombinedTestFixture";
import { expect } from "@playwright/test";
import { createOSPlacesSuccessMapping } from "../../utils/wireMockMappings/OSPlacesWireMockMappings";


/**
 * Postcode / Eligibility Journey Test
 *
 * Verifies the postcode lookup and address selection flow:
 *  1. Enter a postcode on the delivery address page
 *  2. Select an address from the returned list
 *  3. Land on the "how comfortable pricking finger" page
 *
 * The postcode-lookup lambda is configured to call WireMock as its
 * OS Places backend (POSTCODE_LOOKUP_BASE_URL = http://wiremock:8080).
 * This test dynamically stubs the /find endpoint via the WireMock
 * admin API and verifies it was called.
 *
 * The la-lookup (eligibility-lookup) lambda already reads from a
 * static JSON file so no extra stub is needed for that.
 */

const TEST_POSTCODE = "TN37 7PT";

test.describe("Postcode Eligibility Journey", { tag: "@ui" }, () => {
  test("should look up a postcode, select an address and reach the pricking-finger page", async ({
    homeTestStartPage,
    enterDeliveryAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
    wiremock,
  }) => {
    const osPlacesMapping = createOSPlacesSuccessMapping({
      postcode: TEST_POSTCODE,
      addresses: [
        {
          UPRN: "100060113370",
          UDPRN: "200000000001",
          ADDRESS: "775 THE RIDGE, SAINT LEONARDS-ON-SEA, TN37 7PT",
          BUILDING_NUMBER: "775",
          THOROUGHFARE_NAME: "THE RIDGE",
          POST_TOWN: "SAINT LEONARDS-ON-SEA",
          POSTCODE: "TN37 7PT",
        },
        {
          UPRN: "100060113371",
          UDPRN: "200000000002",
          ADDRESS: "777 THE RIDGE, SAINT LEONARDS-ON-SEA, TN37 7PT",
          BUILDING_NUMBER: "777",
          THOROUGHFARE_NAME: "THE RIDGE",
          POST_TOWN: "SAINT LEONARDS-ON-SEA",
          POSTCODE: "TN37 7PT",
        },
      ],
      priority: 1,
    });
    await wiremock.createMapping(osPlacesMapping);

    // --- Act: navigate through the journey ---
    await homeTestStartPage.navigate();
    await expect(homeTestStartPage.headerText).toHaveText("Get a self-test kit for HIV");
    await homeTestStartPage.clickStartNowButton();

    await enterDeliveryAddressPage.waitUntilPageLoaded();
    await enterDeliveryAddressPage.postCodeInput.fill(TEST_POSTCODE);
    await enterDeliveryAddressPage.clickContinueButton();

    await selectDeliveryAddressPage.waitUntilPageLoaded();
    const addressCount = await selectDeliveryAddressPage.getNumberOfFilteredAddresses();
    expect(addressCount).toBeGreaterThanOrEqual(1);

    await selectDeliveryAddressPage.selectAddressAndContinue("1");

    // --- Assert: we land on the how-comfortable-pricking-finger page ---
    await howComfortablePrickingFingerPage.waitUntilPageLoaded();
    await expect(howComfortablePrickingFingerPage.pageHeader).toBeVisible();

    // --- Verify: WireMock received the postcode lookup request ---
    const callCount = await wiremock.verifyRequest("/find", "GET");
    expect(callCount).toBeGreaterThanOrEqual(1);
  });
});
