import { test, expect } from '../../fixtures/commonFixture';
import { AuditEventType } from '@dnhc-health-checks/shared';
import { type DeliverAddress } from '../../lib/apiClients/HealthCheckModel';
import { type SessionItem } from '../../lib/aws/dynamoDB/DbSessionService';
import {
  HealthCheckFactory,
  HealthCheckType
} from '../../testData/healthCheck/healthCheckFactory';

let healthCheckId: string;
let sessionItem: SessionItem;

const searchedPostcode = 'e18rd';
const searchedSingleBuildingNumber = '209';
const expectedAddress: DeliverAddress = {
  addressLine1: 'Flat 209',
  addressLine2: '85 Royal Mint Street',
  addressLine3: '',
  townCity: 'London',
  postcode: 'E1 8RD'
};
const changedAddressLine2 = `Changed ${expectedAddress.addressLine2}`;
const selectAddress = '2';
const numberOfFilteredAddresses = 47;
const mockNumberOfFilteredAddresses = 13;

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
          HealthCheckType.QUESTIONNAIRE_COMPLETED
        )
      );
    await dbAuditEvent.deleteItemByNhsNumber(testedUser.nhsNumber);
    sessionItem = await dbSessionService.getLatestSessionItemsByNhsNumber(
      testedUser.nhsNumber
    );
  }
);

test(
  'Order a blood test kit happy path with searching an address',
  {
    tag: ['@ui', '@bloodTests', '@regression', '@happyPath']
  },
  async ({
    taskListPage,
    bloodTestPages,
    testedUser,
    dbAuditEvent,
    dbHealthCheckService,
    config
  }) => {
    const testStartDate = new Date().toISOString();

    await test.step('Go to Blood test section, enter your postcode and search an addresses', async () => {
      await taskListPage.goToTaskListPageAndWaitForLoading();
      await taskListPage.clickOrderABloodTestKitLink();
      await bloodTestPages.orderBloodTestKitPage.waitUntilLoaded();
      await bloodTestPages.orderBloodTestKitPage.clickContinueButton();
      await bloodTestPages.findDeliveryAddressPage.waitUntilLoaded();
      await bloodTestPages.findDeliveryAddressPage.fillPostcodeField(
        searchedPostcode
      );
      await bloodTestPages.findDeliveryAddressPage.clickContinueButton();
      await bloodTestPages.selectDeliveryAddressPage.waitUntilLoaded();
    });

    await test.step('Check if AddressLookupPerformed event was created in the db', async () => {
      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.AddressLookupPerformed,
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
    });

    await test.step('Click Search Again, go back to FindDeliveryAddress Page and filter search results', async () => {
      await bloodTestPages.selectDeliveryAddressPage.clickSearchAgainLink();
      await bloodTestPages.findDeliveryAddressPage.waitUntilLoaded();
      await bloodTestPages.findDeliveryAddressPage.fillPostcodeField(
        searchedPostcode
      );
      await bloodTestPages.findDeliveryAddressPage.clickContinueButton();
      await bloodTestPages.selectDeliveryAddressPage.waitUntilLoaded();
      await bloodTestPages.selectDeliveryAddressPage.selectAddress(
        selectAddress
      );

      expect(
        await bloodTestPages.selectDeliveryAddressPage.getNumberOfFilteredAddresses()
      ).toEqual(
        (config.osPlaceMock ?? true)
          ? mockNumberOfFilteredAddresses
          : numberOfFilteredAddresses
      );

      await bloodTestPages.selectDeliveryAddressPage.clickContinueButton();
    });

    await test.step('Check if DeliveryAddressSelected event was created in the db', async () => {
      const lastMessage =
        await dbAuditEvent.waitForAnAuditEventItemsByNhsNumber(
          testedUser.nhsNumber,
          AuditEventType.DeliveryAddressSelected,
          testStartDate
        );
      expect(lastMessage).toBeTruthy();
    });

    await test.step('Click Back and check if we are redirected to the FindDeliveryAddress page', async () => {
      await bloodTestPages.confirmDetailsPage.clickBackLink();
      await bloodTestPages.findDeliveryAddressPage.waitUntilLoaded();
      await bloodTestPages.findDeliveryAddressPage.clickContinueButton();
      await bloodTestPages.selectDeliveryAddressPage.selectAddress(
        selectAddress
      );
      await bloodTestPages.selectDeliveryAddressPage.clickContinueButton();
    });

    await test.step('Go to the the Confirm Details Page and Check if selected address data is visible on it', async () => {
      const addressSummaryField =
        await bloodTestPages.confirmDetailsPage.getAddressSummaryText();

      expect(addressSummaryField).toContain(expectedAddress.addressLine1);
      expect(addressSummaryField).toContain(expectedAddress.addressLine2);
      expect(addressSummaryField).toContain(expectedAddress.townCity);
      expect(addressSummaryField).toContain(expectedAddress.postcode);
    });

    await test.step('Click ChangeAddress link, change AddressLine2 field and check if updated', async () => {
      await bloodTestPages.enterPhoneNumberPage.waitUntilLoaded();
      await bloodTestPages.enterPhoneNumberPage.clickContinueButton();
      await bloodTestPages.confirmDetailsPage.clickChangeAddressLink();

      await bloodTestPages.enterDeliveryAddressPage.fillAddressLine2Field(
        changedAddressLine2
      );
      await bloodTestPages.enterDeliveryAddressPage.clickContinueButton();
      await bloodTestPages.enterPhoneNumberPage.waitUntilLoaded();
      await bloodTestPages.enterPhoneNumberPage.clickContinueButton();
      await bloodTestPages.confirmDetailsPage.waitUntilLoaded();

      const healthCheckItem =
        await dbHealthCheckService.getHealthCheckItemById(healthCheckId);

      expect(healthCheckItem.bloodTestOrder?.address?.addressLine2).toEqual(
        changedAddressLine2
      );
      expect(
        await bloodTestPages.confirmDetailsPage.getAddressSummaryText()
      ).toContain(changedAddressLine2);
    });

    await test.step('Click Save and continue button and check if BloodTestOrdered Page was displayed with correct address', async () => {
      await bloodTestPages.confirmDetailsPage.clickSaveAndContinueButton();
      await bloodTestPages.bloodTestOrderedPage.waitUntilLoaded();

      const addressSummaryField =
        await bloodTestPages.bloodTestOrderedPage.getAddressSummaryText();

      expect(addressSummaryField).toContain(expectedAddress.addressLine2);
      expect(addressSummaryField).toContain(changedAddressLine2);
      expect(addressSummaryField).toContain(expectedAddress.townCity);
      expect(addressSummaryField).toContain(expectedAddress.postcode);
    });
  }
);

test(
  'Order a blood test kit happy path with searching a single address',
  {
    tag: ['@ui', '@bloodTests', '@regression', '@happyPath']
  },
  async ({ taskListPage, bloodTestPages, dbHealthCheckService }) => {
    await test.step('Go to Blood test section, enter your postcode and search for a single addresses', async () => {
      await taskListPage.goToTaskListPageAndWaitForLoading();
      await taskListPage.clickOrderABloodTestKitLink();
      await bloodTestPages.orderBloodTestKitPage.waitUntilLoaded();
      await bloodTestPages.orderBloodTestKitPage.clickContinueButton();
      await bloodTestPages.findDeliveryAddressPage.waitUntilLoaded();
      await bloodTestPages.findDeliveryAddressPage.fillPostcodeField(
        searchedPostcode
      );
      await bloodTestPages.findDeliveryAddressPage.fillBuildingNumberField(
        searchedSingleBuildingNumber
      );
      await bloodTestPages.findDeliveryAddressPage.clickContinueButton();
    });
    await test.step('Click Continue and check if we are on Enter Phone Number page', async () => {
      await bloodTestPages.enterPhoneNumberPage.waitUntilLoaded();
      await bloodTestPages.enterPhoneNumberPage.clickContinueButton();
    });
    await test.step('Click Continue and check if we are on Confirm Your Details page', async () => {
      await bloodTestPages.confirmDetailsPage.waitUntilLoaded();
      const addressSummaryField =
        await bloodTestPages.confirmDetailsPage.getAddressSummaryText();

      expect(addressSummaryField).toContain(sessionItem.firstName);
      expect(addressSummaryField).toContain(sessionItem.lastName);
      expect(addressSummaryField).toContain(expectedAddress.addressLine1);
      expect(addressSummaryField).toContain(expectedAddress.addressLine2);
      expect(addressSummaryField).toContain(expectedAddress.townCity);
      expect(addressSummaryField).toContain(expectedAddress.postcode);
    });

    await test.step('Click Save and continue button and check if BloodTestOrdered Page was displayed with correct address', async () => {
      await bloodTestPages.confirmDetailsPage.clickSaveAndContinueButton();
      await bloodTestPages.bloodTestOrderedPage.waitUntilLoaded();

      const addressSummaryField =
        await bloodTestPages.bloodTestOrderedPage.getAddressSummaryText();

      expect(addressSummaryField).toContain(expectedAddress.addressLine1);
      expect(addressSummaryField).toContain(expectedAddress.addressLine2);
      expect(addressSummaryField).toContain(expectedAddress.townCity);
      expect(addressSummaryField).toContain(expectedAddress.postcode);
    });

    await test.step('Check if Blood test order was created in db', async () => {
      const dbitem =
        await dbHealthCheckService.getHealthCheckItemById(healthCheckId);

      expect(dbitem.bloodTestOrder?.address?.addressLine1).toEqual(
        expectedAddress.addressLine1
      );
      expect(dbitem.bloodTestOrder?.address?.addressLine2).toEqual(
        expectedAddress.addressLine2
      );
      expect(dbitem.bloodTestOrder?.address?.addressLine3).toEqual(
        expectedAddress.addressLine3
      );
      expect(dbitem.bloodTestOrder?.address?.townCity).toEqual(
        expectedAddress.townCity
      );
      expect(dbitem.bloodTestOrder?.address?.postcode).toEqual(
        expectedAddress.postcode
      );
      expect(dbitem.bloodTestOrder?.isBloodTestSectionSubmitted).toEqual(true);
    });
  }
);
