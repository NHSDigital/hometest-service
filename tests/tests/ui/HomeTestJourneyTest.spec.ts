import { test } from "../../fixtures/CombinedTestFixture";
import { expect } from "@playwright/test";
import { AddressModel } from "../../models/Address";
import { PersonalDetailsModel } from "../../models/PersonalDetails";

const randomAddress = AddressModel.getRandomAddress();
const personalDetails = PersonalDetailsModel.getRandomPersonalDetails();
const makeAComplaintUrl = "https://ico.org.uk/make-a-complaint/";
const cyberAwareUrl = "https://www.ncsc.gov.uk/cyberaware/home";
const helpAndSupportUrl = "https://www.nhs.uk/nhs-app/help/";

test.describe("Editing during the order flow", { tag: "@ui" }, () => {
  test.beforeEach(async ({ homeTestStartPage, loginUser, context, page }) => {

    await loginUser(page);
    await expect(homeTestStartPage.headerText).toHaveText("Get a self-test kit for HIV");
    await homeTestStartPage.clickStartNowButton();
  });

  test("Updated address reflected after editing postcode during the flow", async ({
    enterDeliveryAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
    confirmMobileNumberPage,
    checkYourAnswersPage,
  }) => {
    const newRandomAddress = AddressModel.getRandomAddress();
    await enterDeliveryAddressPage.fillPostCodeAndContinue(randomAddress);
    await selectDeliveryAddressPage.clickEditPostcodeLink();
    await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(newRandomAddress);
    const selectedAddress = await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await confirmMobileNumberPage.selectConfirmMobileNumberAndContinue();
    const actualAddress = await checkYourAnswersPage.getAddressValue();

    // Verify all actual address records are present in selected address - selected address can contain additional information like building name which is not present in actual address
    actualAddress?.forEach((addressLine) => {
      expect(selectedAddress).toContainEqual(addressLine);
    });
  });

  test("Updated mobile number reflected after changing it during the flow", async ({
    enterDeliveryAddressPage,
    selectDeliveryAddressPage,
    howComfortablePrickingFingerPage,
    confirmMobileNumberPage,
    checkYourAnswersPage,
  }) => {
    await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
    await selectDeliveryAddressPage.selectAddressAndContinue();
    await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
    await confirmMobileNumberPage.fillAlternativeMobileNumberAndContinue(personalDetails);
    const mobileNumber = await checkYourAnswersPage.getMobileNumberValue();
    expect(mobileNumber?.replace(/[^\d+]/g, "")).toContain(
      personalDetails.mobileNumber.replace(/[^\d+]/g, ""),
    );
  });
});

test.describe("Check your answers page - Change fields", { tag: "@ui" }, () => {
  test.beforeEach(
    async ({
      homeTestStartPage,
      enterDeliveryAddressPage,
      selectDeliveryAddressPage,
      howComfortablePrickingFingerPage,
      confirmMobileNumberPage,
      checkYourAnswersPage,
      loginUser,
      context,
      page,
    }) => {

      await loginUser(page);
      await homeTestStartPage.navigate();
      await expect(homeTestStartPage.headerText).toHaveText("Get a self-test kit for HIV");
      await homeTestStartPage.clickStartNowButton();
      await enterDeliveryAddressPage.fillPostCodeAndAddressAndContinue(randomAddress);
      await selectDeliveryAddressPage.selectAddressAndContinue();
      await howComfortablePrickingFingerPage.selectYesOptionAndContinue();
      await confirmMobileNumberPage.selectConfirmMobileNumberAndContinue();
      await checkYourAnswersPage.checkConsentCheckbox();
    },
  );

  test("Update delivery address and mobile number and assert correct values", async ({
    checkYourAnswersPage,
    enterDeliveryAddressPage,
    enterAddressManuallyPage,
    confirmMobileNumberPage,
  }) => {
    const newAddress = AddressModel.getRandomAddress();
    const newPersonalDetails = PersonalDetailsModel.getRandomPersonalDetails();
    await checkYourAnswersPage.clickDeliveryAddressChangeLink();
    await enterDeliveryAddressPage.clickEnterAddressManuallyLink();
    await enterAddressManuallyPage.fillDeliveryAddressFields(newAddress);
    await enterAddressManuallyPage.clickContinue();

    await checkYourAnswersPage.clickMobileNumberChangeLink();
    await confirmMobileNumberPage.fillAlternativeMobileNumberAndContinue(newPersonalDetails);

    const actualAddress = await checkYourAnswersPage.getAddressValue();
    expect(actualAddress).toEqual(newAddress.toStringArray());
    const actualMobileNumber = await checkYourAnswersPage.getMobileNumberValue();
    expect(actualMobileNumber?.replace(/[^\d+]/g, "")).toContain(
      newPersonalDetails.mobileNumber.replace(/[^\d+]/g, ""),
    );

    const isChecked = await checkYourAnswersPage.isConsentCheckboxChecked();
    expect(isChecked).toBe(true);
  });
});

test("Verify Privacy Policy page", async ({ homeTestStartPage, privacyPolicyPage, context, loginUser, page }) => {

  await loginUser(page);
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

test("Verify Terms of Use page", async ({
  homeTestStartPage,
  termsOfUsePage,
  context,
  page,
  privacyPolicyPage,
  loginUser,
}) => {

  await loginUser(page);
  await homeTestStartPage.navigate();
  await expect(homeTestStartPage.headerText).toHaveText("Get a self-test kit for HIV");
  await homeTestStartPage.clickTermsOfUseLink();
  await termsOfUsePage.waitUntilPageLoaded();

  const [cyberAwareTab] = await Promise.all([
    context.waitForEvent("page"),
    termsOfUsePage.clickCyberAwareLink(),
  ]);
  await cyberAwareTab.waitForLoadState();
  expect(cyberAwareTab.url()).toBe(cyberAwareUrl);
  await cyberAwareTab.close();
  await page.bringToFront();

  const [helpAndSupportTab] = await Promise.all([
    context.waitForEvent("page"),
    termsOfUsePage.clickHelpAndSupportLink(),
  ]);
  await helpAndSupportTab.waitForLoadState();
  expect(helpAndSupportTab.url()).toBe(helpAndSupportUrl);
  await helpAndSupportTab.close();
  await page.bringToFront();

  await termsOfUsePage.clickHomeTestPrivacyPolicyLink();
  await privacyPolicyPage.waitUntilPageLoaded();
  await privacyPolicyPage.clickBackLink();
  await termsOfUsePage.waitUntilPageLoaded();
  await termsOfUsePage.clickBackLink();
  await expect(homeTestStartPage.headerText).toHaveText("Get a self-test kit for HIV");
});
