import { test, expect } from '../../fixtures/commonFixture';
import {
  getDeliverAddressWithAllFields,
  getSanitizingAddressTestData
} from '../../testData/deliveryAddressTestData';
import { AuditEventType } from '@dnhc-health-checks/shared';
import { type SessionItem } from '../../lib/aws/dynamoDB/DbSessionService';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

let healthCheckId: string;
let sessionItem: SessionItem;

test.beforeEach(
  async ({
    testedUser,
    dynamoDBServiceUtils,
    dbAuditEvent,
    dbSessionService
  }) => {
    healthCheckId =
      await dynamoDBServiceUtils.cleanHealthCheckTableAndAddHealthCheckItem(
        testedUser,
        HealthCheckFactory.createHealthCheck(
          testedUser,
          HealthCheckType.QUESTIONNAIRE_FILLED
        )
      );
    await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
    sessionItem = await dbSessionService.getLatestSessionItemsByNhsNumber(
      testedUser.nhsNumber
    );
  }
);

test(
  'Order a blood test kit happy path',
  {
    tag: ['@ui', '@happyPath', '@bloodTests', '@regression']
  },
  async ({
    taskListPage,
    bloodTestPages,
    submitAndReviewPages,
    testedUser,
    dbAuditEvent,
    dbHealthCheckService
  }) => {
    const testStartDate = new Date().toISOString();
    const deliveryAddress = getDeliverAddressWithAllFields();
    const changedAddressLine1 = `Changed ${deliveryAddress.addressLine1}`;

    await test.step('Go to the Submit and Review section, complete it and check redirection to the OrderBloodTestKit Page', async () => {
      await taskListPage.goToTaskListPageAndWaitForLoading();
      await taskListPage.clickReviewAndSubmitLink();
      await submitAndReviewPages.checkYourAnswersReviewSubmitPage.waitUntilLoaded();
      await submitAndReviewPages.checkYourAnswersReviewSubmitPage.clickSubmitButton();
      await bloodTestPages.orderBloodTestKitPage.waitUntilLoaded();
    });

    await test.step('Check if SectionStartBloodTest event was automatically created', async () => {
      const sectionStartBloodTestMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.SectionStartBloodTest,
          testStartDate
        );
      expect(
        sectionStartBloodTestMessage,
        'SectionStartBloodTest event was not found'
      ).toBeTruthy();
    });

    await test.step('Check if OrderBloodTestKit Page contains a Success banner after redirection from the Submit and Review section', async () => {
      expect(
        await bloodTestPages.orderBloodTestKitPage.isSuccessBannerVisible(),
        'Success banner was not visible'
      ).toBeTruthy();
    });

    await test.step('Click Back button and revisit Blood test section to check if success banner is not displayed second time', async () => {
      await bloodTestPages.orderBloodTestKitPage.clickBackLink();
      await taskListPage.waitUntilLoaded();
      await taskListPage.clickOrderABloodTestKitLink();
      await bloodTestPages.orderBloodTestKitPage.waitUntilLoaded();
      expect(
        await bloodTestPages.orderBloodTestKitPage.isSuccessBannerVisible(),
        'Success banner should not be visible after revisiting the page'
      ).not.toBeTruthy();
    });

    await test.step('Click "I do not want to do a blood test at home" and check if BloodTestDeclined event was created', async () => {
      await bloodTestPages.orderBloodTestKitPage.clickCantTakeBloodTestLink();
      await bloodTestPages.needBloodTestPage.waitUntilLoaded();

      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.BloodTestDeclined,
          testStartDate
        );
      expect(lastMessage).toBeTruthy();

      await bloodTestPages.needBloodTestPage.clickBackLink();
      await bloodTestPages.orderBloodTestKitPage.waitUntilLoaded();
    });

    await test.step('Enter your deliver address and check if data are visible in questionnaire', async () => {
      await bloodTestPages.orderBloodTestKitPage.clickContinueButton();
      await bloodTestPages.findDeliveryAddressPage.waitUntilLoaded();
      await bloodTestPages.findDeliveryAddressPage.clickEnterAddressManuallyLink();
      await bloodTestPages.enterDeliveryAddressPage.waitUntilLoaded();
      await bloodTestPages.enterDeliveryAddressPage.fillDeliveryAddressAndClickContinue(
        deliveryAddress
      );
      await bloodTestPages.enterPhoneNumberPage.waitUntilLoaded();
      await bloodTestPages.enterPhoneNumberPage.clickContinueButton();
      await bloodTestPages.confirmDetailsPage.waitUntilLoaded();

      const healthCheckItem =
        await dbHealthCheckService.getHealthCheckItemById(healthCheckId);

      expect(healthCheckItem.bloodTestOrder?.address?.addressLine1).toEqual(
        deliveryAddress.addressLine1
      );
      expect(healthCheckItem.bloodTestOrder?.address?.addressLine2).toEqual(
        deliveryAddress.addressLine2
      );
      expect(healthCheckItem.bloodTestOrder?.address?.townCity).toEqual(
        deliveryAddress.townCity
      );
      expect(healthCheckItem.bloodTestOrder?.address?.addressLine3).toEqual(
        deliveryAddress.addressLine3
      );
      expect(healthCheckItem.bloodTestOrder?.address?.postcode).toEqual(
        deliveryAddress.postcode
      );
    });

    await test.step('Check if DeliveryAddressEntered event was created in the db', async () => {
      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.DeliveryAddressEntered,
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
    });

    await test.step('Check if entered address data and patient first/last name are visible on the Confirm Details Page', async () => {
      const addressSummaryField =
        await bloodTestPages.confirmDetailsPage.getAddressSummaryText();

      expect(addressSummaryField).toContain(sessionItem.firstName);
      expect(addressSummaryField).toContain(sessionItem.lastName);
      expect(addressSummaryField).toContain(deliveryAddress.addressLine1);
      expect(addressSummaryField).toContain(deliveryAddress.addressLine2);
      expect(addressSummaryField).toContain(deliveryAddress.addressLine3);
      expect(addressSummaryField).toContain(deliveryAddress.townCity);
      expect(addressSummaryField).toContain(deliveryAddress.postcode);
    });

    await test.step('Click ChangeAddress link, change AddressLine1 field and check if updated', async () => {
      await bloodTestPages.confirmDetailsPage.clickChangeAddressLink();

      await bloodTestPages.enterDeliveryAddressPage.fillAddressLine1Field(
        changedAddressLine1
      );
      await bloodTestPages.enterDeliveryAddressPage.clickContinueButton();
      await bloodTestPages.enterPhoneNumberPage.waitUntilLoaded();
      await bloodTestPages.enterPhoneNumberPage.clickContinueButton();
      await bloodTestPages.confirmDetailsPage.waitUntilLoaded();

      const healthCheckItem =
        await dbHealthCheckService.getHealthCheckItemById(healthCheckId);

      expect(healthCheckItem.bloodTestOrder?.address?.addressLine1).toEqual(
        changedAddressLine1
      );
      expect(
        await bloodTestPages.confirmDetailsPage.getAddressSummaryText()
      ).toContain(changedAddressLine1);
      expect(
        await bloodTestPages.confirmDetailsPage.getAddressSummaryText()
      ).toContain(sessionItem.firstName);
      expect(
        await bloodTestPages.confirmDetailsPage.getAddressSummaryText()
      ).toContain(sessionItem.lastName);
    });

    await test.step('Click Save and continue button and check if BloodTestOrdered Page was displayed with correct address', async () => {
      await bloodTestPages.confirmDetailsPage.clickSaveAndContinueButton();
      await bloodTestPages.bloodTestOrderedPage.waitUntilLoaded();

      const addressSummaryField =
        await bloodTestPages.bloodTestOrderedPage.getAddressSummaryText();

      expect(addressSummaryField).toContain(changedAddressLine1);
      expect(addressSummaryField).toContain(deliveryAddress.addressLine2);
      expect(addressSummaryField).toContain(deliveryAddress.addressLine3);
      expect(addressSummaryField).toContain(deliveryAddress.townCity);
      expect(addressSummaryField).toContain(deliveryAddress.postcode);
    });

    await test.step('Check if DeliveryAddressConfirmed event was created in the db', async () => {
      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.DeliveryAddressConfirmed,
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
    });

    await test.step('Check if SectionCompleteBloodTest event was created and details contains bloodTestUpdatesMobileEntered item', async () => {
      const sectionCompleteBloodTestEvent =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.SectionCompleteBloodTest,
          testStartDate
        );
      expect(
        sectionCompleteBloodTestEvent?.details?.bloodTestUpdatesMobileEntered
      ).toEqual(false);
    });
  }
);

test(
  'Check if special characters are sanitized in blood test forms',
  {
    tag: ['@ui', '@happyPath', '@bloodTests', '@regression']
  },
  async ({
    taskListPage,
    submitAndReviewPages,
    bloodTestPages,
    dbHealthCheckService
  }) => {
    await test.step('Check if chars are sanitized in db after completing form on FindYourDeliveryAddress page', async () => {
      await taskListPage.goToTaskListPageAndWaitForLoading();
      await taskListPage.clickReviewAndSubmitLink();
      await submitAndReviewPages.checkYourAnswersReviewSubmitPage.waitUntilLoaded();
      await submitAndReviewPages.checkYourAnswersReviewSubmitPage.clickSubmitButton();
      await bloodTestPages.orderBloodTestKitPage.waitUntilLoaded();
      await bloodTestPages.orderBloodTestKitPage.clickContinueButton();
      await bloodTestPages.findDeliveryAddressPage.waitUntilLoaded();
      await bloodTestPages.findDeliveryAddressPage.fillPostcodeAndBuildingNumberAndClickContinue(
        getDeliverAddressWithAllFields().postcode,
        getSanitizingAddressTestData.stringWithSpecialChar
      );

      await bloodTestPages.noAddressFoundPage.waitUntilLoaded();

      const healthCheckItem =
        await dbHealthCheckService.getHealthCheckItemById(healthCheckId);

      expect(
        healthCheckItem.bloodTestOrder?.searchParams?.buildingNumber
      ).toEqual(getSanitizingAddressTestData.sanitizedStringInDb);
    });

    await test.step('Check if chars are sanitized in db after completing form on EnterYourAddress page', async () => {
      await bloodTestPages.noAddressFoundPage.clickBackLink();
      await bloodTestPages.findDeliveryAddressPage.clickEnterAddressManuallyLink();
      await bloodTestPages.enterDeliveryAddressPage.waitUntilLoaded();
      await bloodTestPages.enterDeliveryAddressPage.fillDeliveryAddressAndClickContinue(
        {
          addressLine1: getSanitizingAddressTestData.stringWithSpecialChar,
          addressLine2: getSanitizingAddressTestData.stringWithSpecialChar,
          addressLine3: getSanitizingAddressTestData.stringWithSpecialChar,
          townCity: getSanitizingAddressTestData.stringWithSpecialChar,
          postcode: getDeliverAddressWithAllFields().postcode
        }
      );
      await bloodTestPages.enterPhoneNumberPage.waitUntilLoaded();
      await bloodTestPages.enterPhoneNumberPage.clickContinueButton();
      await bloodTestPages.confirmDetailsPage.waitUntilLoaded();

      const healthCheckItem =
        await dbHealthCheckService.getHealthCheckItemById(healthCheckId);

      expect(healthCheckItem.bloodTestOrder?.address?.addressLine1).toEqual(
        getSanitizingAddressTestData.sanitizedStringInDb
      );
      expect(healthCheckItem.bloodTestOrder?.address?.addressLine2).toEqual(
        getSanitizingAddressTestData.sanitizedStringInDb
      );
      expect(healthCheckItem.bloodTestOrder?.address?.addressLine3).toEqual(
        getSanitizingAddressTestData.sanitizedStringInDb
      );
      expect(healthCheckItem.bloodTestOrder?.address?.townCity).toEqual(
        getSanitizingAddressTestData.sanitizedStringInDb
      );
      expect(healthCheckItem.bloodTestOrder?.address?.postcode).toEqual(
        getDeliverAddressWithAllFields().postcode
      );
    });
  }
);
