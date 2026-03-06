import { test } from "../../fixtures/CombinedTestFixture";
import { expect } from "@playwright/test";
import { AddressModel } from "../../models/Address";
import { PersonalDetailsModel } from "../../models/PersonalDetails";
import { SelectDeliveryAddressPage } from "../../page-objects/SelectDeliveryAddressPage";

const randomAddress = AddressModel.getRandomAddress();
const personalDetails = PersonalDetailsModel.getRandomPersonalDetails();
const makeAComplaintUrl = "https://ico.org.uk/make-a-complaint/";

test.describe("HIV Test Order journeys", () => {
  test.beforeEach(async ({ homeTestStartPage }) => {
    await homeTestStartPage.navigate();
    await expect(homeTestStartPage.headerText).toHaveText("Get a self-test kit for HIV");
    await homeTestStartPage.clickStartNowButton();
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
    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await expect(homeTestStartPage.headerText).toHaveText(
      "This is what you'll need to do to give a blood sample",
    );
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await enterMobileNumberPage.fillAlternativeMobileNumber(personalDetails);
    await enterMobileNumberPage.clickContinue();
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
    await selectDeliveryAddressPage.clickContinueButton();
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.clickBloodSampleGuideLink();
    await expect(bloodSampleGuidePage.headerText).toHaveText("Blood sample step-by-step guide");
  });
});

  test.describe("Submit Order Journey", () => {
    let expectedMobileNumber = "";
    test.beforeEach(
      async ({
        homeTestStartPage,
        findAddressPage,
        selectDeliveryAddressPage,
        howComfortablePrickingFingerPage,
        confirmAndUpdateMobileNumberPage,
        checkYourAnswersPage
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
        expectedMobileNumber = await confirmAndUpdateMobileNumberPage.getConfirmationMobileNumberLabelText();
        await confirmAndUpdateMobileNumberPage.selectConfirmMobileNumber();
        await confirmAndUpdateMobileNumberPage.clickContinue();
        await checkYourAnswersPage.selectConsentCheckbox();
      },
    );

    test("Validate Check Your Answers Page", async ({
      checkYourAnswersPage,
      orderSubmittedPage,
      selectDeliveryAddressPage
    }) => {
      const actualDeliveryAddress = await checkYourAnswersPage.getAddress();
      const actualMobileNumber = await checkYourAnswersPage.getMobileNumber();
      const expectedDeliveryAddress = await selectDeliveryAddressPage.getSelectedAddress();
      expect(actualMobileNumber).toBe(expectedMobileNumber);
      console.log("Actual Delivery Address on Check Your Answers Page:", actualDeliveryAddress);
      console.log("Expected Delivery Address from Select Delivery Address Page:", expectedDeliveryAddress);
      expect(actualDeliveryAddress).toBe(expectedDeliveryAddress);
      await checkYourAnswersPage.selectConsentCheckbox();
      await checkYourAnswersPage.clickSubmitOrder();
      // await expect(orderSubmittedPage.headerText).toHaveText("Order submitted");
    });

    test("Change and Verify - Address, Mobile Number and Comfortable with HIV Self-Test Option", async ({
      checkYourAnswersPage,
      selectDeliveryAddressPage,
      findAddressPage,
      howComfortablePrickingFingerPage,
      confirmAndUpdateMobileNumberPage
    }) => {
      await checkYourAnswersPage.clickDeliveryAddressChangeLink();
      await selectDeliveryAddressPage.clickEditAddressLink();
      await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
      await selectDeliveryAddressPage.selectAddressAndContinue();
      const actualDeliveryAddress = await checkYourAnswersPage.getAddress();
      const expectedDeliveryAddress = await selectDeliveryAddressPage.getSelectedAddress();

      await checkYourAnswersPage.clickComfortableChangeLink();
      await howComfortablePrickingFingerPage.clickContinue();
      const actualComfortableDoingText = await checkYourAnswersPage.getComfortableDoingTest();

      await checkYourAnswersPage.clickMobileNumberChangeLink();
      await confirmAndUpdateMobileNumberPage.fillAlternativeMobileNumber(personalDetails);
      const expectedMobileNumber = await confirmAndUpdateMobileNumberPage.getMobileNumberInputValue();
      await confirmAndUpdateMobileNumberPage.clickContinue();
      const actualMobileNumber = await checkYourAnswersPage.getMobileNumber();

      expect(actualDeliveryAddress).toBe(expectedDeliveryAddress);
      expect(actualMobileNumber).toBe(expectedMobileNumber.replace(/[^\d+]/g, ""));
      expect(actualComfortableDoingText).toBe("Change\n Are you comfortable doing the HIV self-test?");
      const isChecked = await checkYourAnswersPage.isConsentCheckboxChecked();
      expect(isChecked).toBe(true);
    });

    test("Check your Answers - Address Change - Enter address manually", async ({
      checkYourAnswersPage,
      findAddressPage,
      enterAddressManuallyPage
    }) => {
      await checkYourAnswersPage.clickDeliveryAddressChangeLink();
      await findAddressPage.clickEnterAddressManuallyLink();
      await enterAddressManuallyPage.fillAddress(randomAddress);
      await enterAddressManuallyPage.clickContinue();
      const actualAddress = await checkYourAnswersPage.getAddress();
      const expectedDeliveryAddress = await enterAddressManuallyPage.getAddressInputValues();
      console.log("Actual Delivery Address on Check Your Answers Page:", actualAddress);
      console.log("Expected Delivery Address from Enter Address Manually Page:", expectedDeliveryAddress);
      expect(actualAddress).toBe(expectedDeliveryAddress);
      const isChecked = await checkYourAnswersPage.isConsentCheckboxChecked();
      expect(isChecked).toBe(true);
    });

    test("Check your Answers - Mobile Number Change - Enter phone number", async ({
      checkYourAnswersPage,
      enterMobileNumberPage,
      confirmAndUpdateMobileNumberPage
    }) => {
      await checkYourAnswersPage.clickMobileNumberChangeLink();
      await confirmAndUpdateMobileNumberPage.selectConfirmMobileNumber();
      await enterMobileNumberPage.fillAlternativeMobileNumber(personalDetails);
      const expectedMobileNumber = await enterMobileNumberPage.getMobileNumberInputValue();
      await enterMobileNumberPage.clickContinue();
      const actualMobileNumber = await checkYourAnswersPage.getMobileNumber();
      expect(actualMobileNumber).toBe(expectedMobileNumber.replace(/[^\d+]/g, ""));
      const isChecked = await checkYourAnswersPage.isConsentCheckboxChecked();
      expect(isChecked).toBe(true);
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
      await expect(homeTestStartPage.headerText).toHaveText("Get a self-test kit for HIV");
      await homeTestStartPage.clickStartNowButton();
      await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
      await selectDeliveryAddressPage.clickEditAddressLink();
      await selectDeliveryAddressPage.clickContinueButton();
      await selectDeliveryAddressPage.selectAddressAndContinue();
      await expect(homeTestStartPage.headerText).toHaveText(
        "This is what you'll need to do to give a blood sample",
      );
      await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    },
  );

  test("Confirm Mobile number test journey", async ({ confirmAndUpdateMobileNumberPage }) => {
    await confirmAndUpdateMobileNumberPage.selectConfirmMobileNumber();
    await confirmAndUpdateMobileNumberPage.clickContinue();
  });

  test("Update alternative mobile number test journey", async ({
    confirmAndUpdateMobileNumberPage,
  }) => {
    await confirmAndUpdateMobileNumberPage.fillAlternativeMobileNumber(personalDetails);
    await confirmAndUpdateMobileNumberPage.clickContinue();
  });
});

test("Verify Privacy Policy page", async ({ homeTestStartPage, privacyPolicyPage, context }) => {
  await homeTestStartPage.navigate();
  await expect(homeTestStartPage.headerText).toHaveText("Get a self-test kit for HIV");
  await homeTestStartPage.clickPrivacyPolicyLink();
  const actualHeaderText = await privacyPolicyPage.getHeaderText();
  expect(actualHeaderText).toBe("Hometest Privacy Policy - Draft v1.0 Jan 2026");
  const [newTab] = await Promise.all([
    context.waitForEvent("page"),
    privacyPolicyPage.clickMakeAComplaintLink(),
  ]);
  await newTab.waitForLoadState();
  expect(newTab.url()).toBe(makeAComplaintUrl);
});
