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
  }) => {
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
    await enterMobileNumberPage.fillAlternativeMobileNumber(personalDetails);
    await enterMobileNumberPage.clickContinue();
  });

  test("Order test journey by providing address manually", async ({
    findAddressPage,
    enterAddressManuallyPage,
  }) => {
    await findAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillAddress(randomAddress);
    await enterAddressManuallyPage.clickContinue();
  });

  test("Order test journey by providing Postcode Only", async ({
    homeTestStartPage,
    findAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
  }) => {
    await findAddressPage.fillPostCodeAndContinue(randomAddress);
    const { filledPostcode } = await findAddressPage.getPostcodeAndAddressInputValues();
    const { actualPostcode } = await selectDeliveryAddressPage.getPostcodeValues();
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

  test.describe("Submit Order Journey", () => {
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
      orderSubmittedPage

    }) => {
      await confirmAndUpdateMobileNumberPage.selectConfirmMobileNumber();
      await confirmAndUpdateMobileNumberPage.clickContinue();
      await expect(orderSubmittedPage.headerText).toHaveText("Order submitted");
    });

    test("Update alternative mobile number test journey", async ({
      confirmAndUpdateMobileNumberPage,
    }) => {
      await confirmAndUpdateMobileNumberPage.fillAlternativeMobileNumber(
        personalDetails,
      );
      await confirmAndUpdateMobileNumberPage.clickContinue();
    });

    test("Check Your Answers Verification", async ({
      confirmAndUpdateMobileNumberPage,
      checkYourAnswersPage
    }) => {
      const expectedMobileNumber = await confirmAndUpdateMobileNumberPage.getConfirmationMobileNumberLabelText();
      await confirmAndUpdateMobileNumberPage.selectConfirmMobileNumber();
      await confirmAndUpdateMobileNumberPage.clickContinue();
      const { actualPostcode, actualMobileNumber } = await checkYourAnswersPage.getPostcodeAndMobileNumberAndComfortableDoingTest();
      expect(actualMobileNumber).toBe(expectedMobileNumber);
      expect(actualPostcode).toBe(actualPostcode);
      await checkYourAnswersPage.selectConsentCheckbox();
      await checkYourAnswersPage.clickSubmitOrder();
    });

    test("Check your Answers - Change Answer - Find Address", async ({
      checkYourAnswersPage,
      selectDeliveryAddressPage,
      findAddressPage,
      confirmAndUpdateMobileNumberPage
    }) => {
      await confirmAndUpdateMobileNumberPage.selectConfirmMobileNumber();
      await confirmAndUpdateMobileNumberPage.clickContinue();
      await checkYourAnswersPage.selectConsentCheckbox();
      await checkYourAnswersPage.clickDeliveryAddressChangeLink();
      await selectDeliveryAddressPage.clickEditAddressLink();
      await findAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
      const { filledPostcode } = await findAddressPage.getPostcodeAndAddressInputValues();
      await selectDeliveryAddressPage.selectAddressAndContinue();
      const { actualPostcode } = await checkYourAnswersPage.getPostcodeAndMobileNumberAndComfortableDoingTest();
      expect(actualPostcode).toBe(filledPostcode);
      const checkedOrNot = await checkYourAnswersPage.isConsentCheckboxChecked();
      expect(checkedOrNot).toBe(true);
    });

    test("Check your Answers -  Change answer - Enter address manually", async ({
      checkYourAnswersPage,
      findAddressPage,
      enterAddressManuallyPage,
      confirmAndUpdateMobileNumberPage
    }) => {
      await confirmAndUpdateMobileNumberPage.selectConfirmMobileNumber();
      await confirmAndUpdateMobileNumberPage.clickContinue();
      await checkYourAnswersPage.selectConsentCheckbox();
      await checkYourAnswersPage.clickDeliveryAddressChangeLink();
      await findAddressPage.clickEnterAddressManuallyLink();
      await enterAddressManuallyPage.fillAddress(randomAddress);
      const { filledPostcode } = await enterAddressManuallyPage.getAddressInputValues();
      await enterAddressManuallyPage.clickContinue();
      const { actualPostcode } = await checkYourAnswersPage.getPostcodeAndMobileNumberAndComfortableDoingTest();
      expect(actualPostcode).toBe(filledPostcode);
      const checkedOrNot = await checkYourAnswersPage.isConsentCheckboxChecked();
      expect(checkedOrNot).toBe(true);
    });

    test("Change answer - Comfortable with HIV self-test", async ({
      checkYourAnswersPage,
      confirmAndUpdateMobileNumberPage
    }) => {
      await confirmAndUpdateMobileNumberPage.selectConfirmMobileNumber();
      await confirmAndUpdateMobileNumberPage.clickContinue();
      await checkYourAnswersPage.selectConsentCheckbox();
      await checkYourAnswersPage.clickComfortableChangeLink();
      await confirmAndUpdateMobileNumberPage.clickContinue();
      const { comfortableDoingTest } = await checkYourAnswersPage.getPostcodeAndMobileNumberAndComfortableDoingTest();
      expect(comfortableDoingTest).toBe("Change\n Are you comfortable doing the HIV self-test?");
      const checkedOrNot = await checkYourAnswersPage.isConsentCheckboxChecked();
      expect(checkedOrNot).toBe(true);
    });

    test("Check your Answers -  Change answer - select phone number", async ({
      checkYourAnswersPage,
      confirmAndUpdateMobileNumberPage,

    }) => {
      await confirmAndUpdateMobileNumberPage.selectConfirmMobileNumber();
      await confirmAndUpdateMobileNumberPage.clickContinue();
      await checkYourAnswersPage.selectConsentCheckbox();
      await checkYourAnswersPage.clickMobileNumberChangeLink();
      await confirmAndUpdateMobileNumberPage.fillAlternativeMobileNumber(personalDetails);
      const expectedMobileNumber = await confirmAndUpdateMobileNumberPage.getMobileNumberInputValue();
      await confirmAndUpdateMobileNumberPage.clickContinue();
      const { actualMobileNumber } = await checkYourAnswersPage.getPostcodeAndMobileNumberAndComfortableDoingTest();
      expect(actualMobileNumber).toBe(expectedMobileNumber);
      const checkedOrNot = await checkYourAnswersPage.isConsentCheckboxChecked();
      expect(checkedOrNot).toBe(true);
    });

    test("Check your Answers -  Change answer -  enter phone number", async ({
      checkYourAnswersPage,
      enterMobileNumberPage,
      confirmAndUpdateMobileNumberPage
    }) => {
      await confirmAndUpdateMobileNumberPage.selectConfirmMobileNumber();
      await confirmAndUpdateMobileNumberPage.clickContinue();
      await checkYourAnswersPage.selectConsentCheckbox();
      await checkYourAnswersPage.clickMobileNumberChangeLink();
      await confirmAndUpdateMobileNumberPage.selectConfirmMobileNumber();
      await enterMobileNumberPage.fillAlternativeMobileNumber(personalDetails);
      const expectedMobileNumber = await enterMobileNumberPage.getMobileNumberInputValue();
      await enterMobileNumberPage.clickContinue();
      const { actualMobileNumber } = await checkYourAnswersPage.getPostcodeAndMobileNumberAndComfortableDoingTest();
      expect(actualMobileNumber).toBe(expectedMobileNumber);
      const checkedOrNot = await checkYourAnswersPage.isConsentCheckboxChecked();
      expect(checkedOrNot).toBe(true);
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
