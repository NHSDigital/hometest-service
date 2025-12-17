import Sinon from 'ts-sinon';
import { Commons } from '../../../src/lib/commons';
import { HttpClient } from '../../../src/lib/http/http-client';
import { LogMethodNames, TestUtil } from '../../util/test-util';
import {
  JSON_API_CONTENT_TYPE,
  THRIVA_FIRST_NAME_MAX_LENGTH,
  THRIVA_LAST_NAME_MAX_LENGTH,
  ThrivaLabOrderHttpClient
} from '../../../src/lib/http/thriva-lab-order-http-client';
import { LabOrderBuilder } from '../../util/test-data-builders/lab-order-builder';
import { HealthCheckDetailsBuilder } from '../../util/test-data-builders/health-check-details-builder';
import { type IPatientData } from '../../../src/lib/models/patient/patient';
import { type ILabOrder } from '@dnhc-health-checks/shared/model/lab-order';
import { type HealthCheckDetails } from '../../../src/lib/models/lab-orders/health-check-details';
import * as uuid from 'uuid';
import {
  type ThrivaLabOrderRequestModel,
  ThrivaLabTestType
} from '../../../src/lib/models/lab-orders/thriva/thriva-lab-order-request-model';
import { PatientDataBuilder } from '../../util/test-data-builders/patient-data-builder';

jest.mock('uuid');
const mockUUID = 'mockUUID';
jest.spyOn(uuid, 'v4').mockReturnValue(mockUUID);

describe('ThrivaLabOrderHttpClient', () => {
  const authApiEndpoint = 'mockAuthEndpoint';
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  const patient: IPatientData = new PatientDataBuilder().build();
  const fulfilmentOrderId = 'fulfilment123';

  const labOrder: ILabOrder = new LabOrderBuilder().build();
  const healthCheckDetails: HealthCheckDetails =
    new HealthCheckDetailsBuilder().build();
  const accessToken = 'MOCK_TOKEN';

  let service: ThrivaLabOrderHttpClient;
  let testUtil: TestUtil;
  let commons: Sinon.SinonStubbedInstance<Commons>;
  let httpClient: Sinon.SinonStubbedInstance<HttpClient>;

  beforeEach(() => {
    commons = sandbox.createStubInstance(Commons);
    httpClient = sandbox.createStubInstance(HttpClient);

    service = new ThrivaLabOrderHttpClient(
      commons as unknown as Commons,
      httpClient as unknown as HttpClient,
      authApiEndpoint
    );
    testUtil = new TestUtil(commons, service.className);
  });

  afterEach(() => {
    sandbox.restore();
    jest.resetAllMocks();
  });

  describe('place order method', () => {
    it('Place order with Thriva', async () => {
      const fulfilmentOrderId = 'fulfilment123';
      httpClient.postRequest.resolves({
        data: { id: fulfilmentOrderId }
      });

      labOrder.phoneNumber = '07999999999';
      const result = await service.placeOrder(
        patient,
        labOrder,
        healthCheckDetails,
        accessToken
      );

      sandbox.assert.calledOnceWithMatch(
        httpClient.postRequest,
        `${authApiEndpoint}/dhc/orders`,
        (actualBody) => {
          return (
            actualBody.data.attributes.order_external_reference ===
              labOrder.id &&
            actualBody.data.attributes.delivery_address.city ===
              labOrder.deliveryAddress.townCity &&
            actualBody.data.attributes.delivery_address.country === 'GB' &&
            actualBody.data.attributes.delivery_address.line1 ===
              labOrder.deliveryAddress.addressLine1 &&
            actualBody.data.attributes.delivery_address.line2 ===
              labOrder.deliveryAddress.addressLine2 &&
            actualBody.data.attributes.delivery_address.line3 ===
              labOrder.deliveryAddress.addressLine3 &&
            actualBody.data.attributes.delivery_address.name ===
              `${patient.firstName} ${patient.lastName}` &&
            actualBody.data.attributes.delivery_address.postcode ===
              labOrder.deliveryAddress.postcode &&
            (
              actualBody.data.attributes.test
                .test_profiles as ThrivaLabTestType[]
            ).includes(ThrivaLabTestType.Cholesterol) &&
            actualBody.data.attributes.user.contact.first_name ===
              patient.firstName &&
            actualBody.data.attributes.user.contact.last_name ===
              patient.lastName &&
            actualBody.data.attributes.user.contact.email === patient.email &&
            actualBody.data.attributes.user.contact.mobile_phone_number ===
              '+447999999999' &&
            actualBody.data.attributes.user.date_of_birth ===
              patient.dateOfBirth &&
            actualBody.data.type === 'order'
          );
        },
        {
          authorization: `Bearer ${accessToken}`,
          'Content-Type': JSON_API_CONTENT_TYPE,
          Accept: JSON_API_CONTENT_TYPE
        }
      );

      expect(result).toContain(fulfilmentOrderId);
    });

    it('Truncates name correctly when placing order with Thriva', async () => {
      httpClient.postRequest.resolves({
        data: { id: fulfilmentOrderId }
      });

      const patientWithLengthyName: IPatientData = {
        ...patient,
        firstName: 'F'.repeat(THRIVA_FIRST_NAME_MAX_LENGTH + 1),
        lastName: 'L'.repeat(THRIVA_LAST_NAME_MAX_LENGTH + 5)
      };
      await service.placeOrder(
        patientWithLengthyName,
        labOrder,
        healthCheckDetails,
        accessToken
      );

      const namePassedToThriva = (
        httpClient.postRequest.getCall(0).args[1] as ThrivaLabOrderRequestModel
      ).data.attributes.delivery_address.name;

      expect(namePassedToThriva).toEqual(
        `${patientWithLengthyName.firstName.slice(0, THRIVA_FIRST_NAME_MAX_LENGTH)} ${patientWithLengthyName.lastName.slice(0, THRIVA_LAST_NAME_MAX_LENGTH)}`
      );
    });

    it('Do not send phone number to Thriva when it is not provided in the order entity', async () => {
      httpClient.postRequest.resolves({
        data: { id: fulfilmentOrderId }
      });

      const orderWithClearedPhoneNumber: ILabOrder = { ...labOrder };
      delete orderWithClearedPhoneNumber.phoneNumber;

      await service.placeOrder(
        patient,
        orderWithClearedPhoneNumber,
        healthCheckDetails,
        accessToken
      );

      const phoneNumberPassedToThriva = (
        httpClient.postRequest.getCall(0).args[1] as ThrivaLabOrderRequestModel
      ).data.attributes.user.contact.mobile_phone_number;

      expect(phoneNumberPassedToThriva).not.toBeDefined();
    });

    it('Throws and logs an error when error occurs', async () => {
      const err = new Error('Mock error');
      httpClient.postRequest.throwsException(err);

      await expect(
        service.placeOrder(patient, labOrder, healthCheckDetails, accessToken)
      ).rejects.toThrow(err);

      testUtil.expectLogProduced(
        'Encountered error while sending request',
        {},
        LogMethodNames.ERROR,
        0
      );
    });
  });
});
