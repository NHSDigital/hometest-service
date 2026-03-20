import { test } from "../../fixtures/CombinedTestFixture";
import { expect } from "@playwright/test";
import { AddressModel } from "../../models/Address";
import type { NHSLoginMockedUser } from "../../utils/users/BaseUser";
import { SpecialUserKey } from "../../utils/users/SpecialUserKey";
import { createWireMockUserInfoMapping } from "../../utils/users/wiremockUserInfoMapping";

const randomAddress = AddressModel.getRandomAddress();

test.describe("HIV Test Order journeys - User under 18", () => {
  let userInfoMappingId: string | undefined;

  test.use({
    errorCaptureOptions: {
      failOnNetworkError: false,
      failOnConsoleError: false,
    },
  });

  test.beforeEach(async ({ homeTestStartPage, loginUser, page, context }) => {

    const { mappingId } = await loginUser(page, SpecialUserKey.UNDER_18);
    userInfoMappingId = mappingId;
    await expect(homeTestStartPage.headerText).toHaveText("Get a self-test kit for HIV");
    await homeTestStartPage.clickStartNowButton();
  });

  test.afterEach(async ({ config, wiremock }) => {
    if (config.useWiremockAuth && userInfoMappingId) {
      await wiremock.deleteMapping(userInfoMappingId);
      userInfoMappingId = undefined;
    }
  });

  test("Order test journey with address search", async ({
    enterDeliveryAddressPage,
    selectDeliveryAddressPage,
    cannotUseServiceUnder18Page,
  }) => {
    await enterDeliveryAddressPage.fillPostCodeAndContinue(randomAddress);
    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();

    await cannotUseServiceUnder18Page.waitUntilPageLoaded();
    await expect(cannotUseServiceUnder18Page.pageHeader).toHaveText(
      "You cannot use this service as you are under 18",
    );
    await cannotUseServiceUnder18Page.expectPostcodeInFindAnotherClinicLink(randomAddress.postCode);
  });

  test("Order test journey with manual address", async ({
    enterDeliveryAddressPage,
    enterAddressManuallyPage,
    cannotUseServiceUnder18Page,
  }) => {
    await enterDeliveryAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillDeliveryAddressFields(randomAddress);
    await enterAddressManuallyPage.clickContinue();
    await cannotUseServiceUnder18Page.waitUntilPageLoaded();
    await expect(cannotUseServiceUnder18Page.pageHeader).toHaveText(
      "You cannot use this service as you are under 18",
    );
    await cannotUseServiceUnder18Page.expectPostcodeInFindAnotherClinicLink(randomAddress.postCode);
  });
});
