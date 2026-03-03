import { test } from "../../fixtures/CombinedTestFixture";
import { expect } from "@playwright/test";
import { AddressModel } from "../../models/Address";
import { PersonalDetailsModel } from "../../models/PersonalDetails";

let actualHeaderText = "";
const randomAddress = AddressModel.getRandomAddress();
const personalDetails = PersonalDetailsModel.getRandomPersonalDetails();
const makeAComplaintUrl = "https://ico.org.uk/make-a-complaint/";

test.describe("HIV Test Order journeys", () => {
  test.beforeEach(async ({ homeTestStartPage }) => {
    await homeTestStartPage.navigate();
    await expect(homeTestStartPage.headerText).toHaveText(
      "Get a self-test kit for HIV",
    );
    await homeTestStartPage.clickStartNowButton();
  });

  test("Order test journey", async ({
    homeTestStartPage,
    findAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
    confirmAndUpdateMobileNumberPage,
    checkYourAnswersPage
  }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    const { filledPostcode } = await findAddressPage.getPostcodeAndAddressInputValues();
    await selectDeliveryAddressPage.clickEditAddressLink();
    const { postCode, firstLineAddress } =
      await findAddressPage.getPostcodeAndAddressValues();
    expect(postCode).toBe(randomAddress.postCode);
    expect(firstLineAddress).toBe(randomAddress.addressLine1);
    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await expect(homeTestStartPage.headerText).toHaveText("This is what you'll need to do to give a blood sample");
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    // ********
    await confirmAndUpdateMobileNumberPage.selectConfirmMobileNumber();
    const expectedMobileNumber = await checkYourAnswersPage.getMobileNumber();
    await confirmAndUpdateMobileNumberPage.clickContinue();
    // const { actualPostcode, actualMobileNumber } = await checkYourAnswersPage.getPostcodeAndMobileNumber();
    // expect(actualMobileNumber).toBe(expectedMobileNumber);
    // expect(actualPostcode).toBe(filledPostcode);
    await checkYourAnswersPage.selectConsentCheckbox();
    await checkYourAnswersPage.clickSubmitOrder();
    await expect(checkYourAnswersPage.headerText).toHaveText("Order submitted");
  });

  test("Mobile number test journey", async ({
    homeTestStartPage,
    findAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
    enterMobileNumberPage,
  }) => {
    await findAddressPage.fillPostCodeAndContinue(randomAddress);
    await selectDeliveryAddressPage.clickEditAddressLink();
    const { postCode } =
      await findAddressPage.getPostcodeAndAddressValues();
    expect(postCode).toBe(randomAddress.postCode);
    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await expect(homeTestStartPage.headerText).toHaveText(
      "This is what you'll need to do to give a blood sample",
    );
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await enterMobileNumberPage.fillAlternativeMobileNumberAndContinue(
      personalDetails,
    );
  });

  test("Order test journey by providing address manually", async ({
    findAddressPage,
    enterAddressManuallyPage,
  }) => {
    await findAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillAddressAndContinue(randomAddress);
  });

  test("Order test journey by providing Postcode Only", async ({
    homeTestStartPage,
    findAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
  }) => {
    await findAddressPage.fillPostCodeAndContinue(randomAddress);
    const { filledPostcode } = await findAddressPage.getPostcodeAndAddressInputValues();
    const {actualPostcode} = await selectDeliveryAddressPage.getPostcodeValues();
    expect(filledPostcode).toBe(actualPostcode);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await expect(homeTestStartPage.headerText).toHaveText(
      "This is what you'll need to do to give a blood sample",
    );
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
  });

  test("Choose to go to Sexual health clinic instead", async ({
    findAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
  }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.selectNoOptionAndContinue();
  });

  test("Check the guide to giving blood samples", async ({
    findAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
    bloodSampleGuidePage,
  }) => {
    await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.clickEditAddressLink();
    const { postCode, firstLineAddress } =
      await findAddressPage.getPostcodeAndAddressValues();
    expect(postCode).toBe(randomAddress.postCode);
    expect(firstLineAddress).toBe(randomAddress.addressLine1);
    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.clickBloodSampleGuideLink();
    await expect(bloodSampleGuidePage.headerText).toHaveText(
      "Blood sample step-by-step guide",
    );
  });

  test.describe("Confirm and update mobile number journey", () => {
    test.beforeEach(
      async ({
        homeTestStartPage,
        findAddressPage,
        selectDeliveryAddressPage,
        howComfortablePrickingFingerPage,
      }) => {
        await homeTestStartPage.navigate();
        await expect(homeTestStartPage.headerText).toHaveText(
          "Get a self-test kit for HIV",
        );
        await homeTestStartPage.clickStartNowButton();
        await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
        await selectDeliveryAddressPage.clickEditAddressLink();
        const { postCode, firstLineAddress } =
          await findAddressPage.getPostcodeAndAddressValues();
        expect(postCode).toBe(randomAddress.postCode);
        expect(firstLineAddress).toBe(randomAddress.addressLine1);
        await selectDeliveryAddressPage.clickContinueButton();
        await selectDeliveryAddressPage.selectAddressAndContinue();
        await expect(homeTestStartPage.headerText).toHaveText(
          "This is what you'll need to do to give a blood sample",
        );
        await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
      },
    );

    test("Confirm Mobile number test journey", async ({
      confirmAndUpdateMobileNumberPage,
    }) => {
      await confirmAndUpdateMobileNumberPage.selectConfirmMobileNumber();
      await confirmAndUpdateMobileNumberPage.clickContinue();
    });

    test("Update alternative mobile number test journey", async ({
      confirmAndUpdateMobileNumberPage,
    }) => {
      await confirmAndUpdateMobileNumberPage.fillAlternativeMobileNumber(
        personalDetails,
      );
      await confirmAndUpdateMobileNumberPage.clickContinue();
    });
  });
});

test("Verify Privacy Policy page", async ({
  homeTestStartPage,
  privacyPolicyPage,
  context,
}) => {
  await homeTestStartPage.navigate();
  await expect(homeTestStartPage.headerText).toHaveText(
    "Get a self-test kit for HIV",
  );
  await homeTestStartPage.clickPrivacyPolicyLink();
  actualHeaderText = await privacyPolicyPage.getHeaderText();
  expect(actualHeaderText).toBe(
    "Hometest Privacy Policy - Draft v1.0 Jan 2026",
  );
  const [newTab] = await Promise.all([
    context.waitForEvent("page"),
    privacyPolicyPage.clickMakeAComplaintLink(),
  ]);
  await newTab.waitForLoadState();
  expect(newTab.url()).toBe(makeAComplaintUrl);
});
