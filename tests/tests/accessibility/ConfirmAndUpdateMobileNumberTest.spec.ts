import { expect } from "@playwright/test";
import { test } from "../../fixtures/CombinedTestFixture";
import { PersonalDetailsModel } from "../../models/PersonalDetails";
import { AddressModel } from "../../models/Address";

const randomAddress = AddressModel.getRandomAddress();
const randomMobileNumber = PersonalDetailsModel.getRandomPersonalDetails();

test(
  "Confirm and update mobile number page",
  {
    tag: ["@accessibility"],
  },
  async ({
    homeTestStartPage,
    findAddressPage,
    selectDeliveryAddressPage,
    accessibility,
    confirmAndUpdateMobileNumberPage,
    howComfortablePrickingFingerPage,
  }) => {
    await homeTestStartPage.navigate();
    await homeTestStartPage.clickStartNowButton();
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.waitUntilPageLoad();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.waitUntilPageLoad();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await confirmAndUpdateMobileNumberPage.selectConfirmMobileNumber();
    let accessErrors = await accessibility.runAccessibilityCheck(
      confirmAndUpdateMobileNumberPage.page,
      "Confirm and Update Mobile Number Page",
    );
    expect(accessErrors).toHaveLength(0);
    await confirmAndUpdateMobileNumberPage.fillAlternativeMobileNumber(
      randomMobileNumber,
    );
    accessErrors = await accessibility.runAccessibilityCheck(
      confirmAndUpdateMobileNumberPage.page,
      "Confirm and Update Mobile Number Page",
    );
    expect(accessErrors).toHaveLength(0);
  },
);
