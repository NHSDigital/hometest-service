import { Commons } from '../../../src/lib/commons';
import Sinon from 'ts-sinon';
import * as uuid from 'uuid';
import {
  HealthCheckEligibilityService,
  HealthCheckEligibilityStatus,
  type HealthCheckEligibilityServiceParams,
  type IHealthCheckEligibilityService
} from '../../../src/lib/eligibility/health-check-eligibility-service';
import {
  OdsCodesDbClient,
  type IOdsCodesDbClient
} from '../../../src/lib/db/db-clients/ods-codes-db-client';
import { EventsQueueClientService } from '../../../src/lib/events/events-queue-client-service';
import { HealthCheckDbClient } from '../../../src/lib/db/db-clients/health-checks-db-client';
import { AuditEventType, type IHealthCheck } from '@dnhc-health-checks/shared';
import { S3Client } from '../../../src/lib/aws/s3-client';

jest.mock('uuid');
const mockUUID = 'mockUUID';

jest.spyOn(uuid, 'v4').mockReturnValue(mockUUID);
const healthCheck: IHealthCheck = {
  id: '12345',
  dataModelVersion: '2.3.4',
  nhsNumber: 'nhsNumber',
  createdAt: '2021-01-01T00:00:00Z'
} as unknown as IHealthCheck;

describe('IHealthCheckEligibilityService tests', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let odsCodesDbClientStub: Sinon.SinonStubbedInstance<IOdsCodesDbClient>;
  let eventsQueueClientStub: Sinon.SinonStubbedInstance<EventsQueueClientService>;
  let healthCheckDbClientStub: Sinon.SinonStubbedInstance<HealthCheckDbClient>;
  let s3ClientStub: Sinon.SinonStubbedInstance<S3Client>;

  let service: IHealthCheckEligibilityService;
  const serviceClassName = 'HealthCheckEligibilityService';
  const healthCheckMinimumAge = 40;
  const healthCheckMaximumAge = 74;
  const enabledOdsCode = 'EnabledCode';
  const disabledOdsCode = 'DisabledCode';
  const gpDetails = {
    gpEmail: 'email@mock.gp',
    gpName: 'mocked gp'
  };
  const testNhsNumber = '1234567890';
  const testNotAllowedNhsNumber = '987654321';
  const testPatientId = 'patientFromMars';
  const testNhcVersion = 'nhcVersion';
  const validIdentityLevel = 'P9';
  const invalidIdentityLevel = 'P5';
  const bucketName = 'cohort-bucket';
  const enableNhsNumberCheck = true;
  const allowedNhsNumbers = [testNhsNumber];

  function getDobOfSomeoneWhoTurns(age: number): Date {
    const dateOfBirth = new Date();
    dateOfBirth.setFullYear(dateOfBirth.getFullYear() - age);
    return dateOfBirth;
  }

  function increaseDateByDays(date: Date, days: number): Date {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate;
  }

  function formatDateOfBirth(date: Date): string {
    // return date formatted yyyy-mm-dd to replicate what NHS Login return to us
    return date.toISOString().split('T')[0];
  }

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    commonsStub.nhcVersion = testNhcVersion;

    odsCodesDbClientStub = sandbox.createStubInstance(OdsCodesDbClient);
    eventsQueueClientStub = sandbox.createStubInstance(
      EventsQueueClientService
    );
    healthCheckDbClientStub = sandbox.createStubInstance(HealthCheckDbClient);
    s3ClientStub = sandbox.createStubInstance(S3Client);

    const mockParameters: HealthCheckEligibilityServiceParams = {
      healthCheckMinimumAge,
      healthCheckMaximumAge,
      healthCheckDbClient: healthCheckDbClientStub,
      s3Client: s3ClientStub,
      enableNhsNumberCheck,
      selectedCohortBucketName: bucketName,
      odsCodesDbClient: odsCodesDbClientStub,
      eventsQueueClientService: eventsQueueClientStub
    };
    service = new HealthCheckEligibilityService(
      commonsStub as unknown as Commons,
      mockParameters
    );

    odsCodesDbClientStub.getOdsCodeStatus.withArgs(enabledOdsCode).resolves({
      gpOdsCode: enabledOdsCode,
      enabled: true,
      localAuthority: 'authority name',
      ...gpDetails
    });
    odsCodesDbClientStub.getOdsCodeStatus.withArgs(disabledOdsCode).resolves({
      gpOdsCode: disabledOdsCode,
      enabled: false,
      localAuthority: 'authority name',
      ...gpDetails
    });

    s3ClientStub.getObject.resolves(allowedNhsNumbers);
  });

  afterEach(() => {
    sandbox.reset();
    sandbox.resetHistory();
  });

  describe('checkPatientEligibilityToLogIn tests', () => {
    test.each([
      getDobOfSomeoneWhoTurns(healthCheckMinimumAge),
      getDobOfSomeoneWhoTurns(healthCheckMinimumAge + 10),
      increaseDateByDays(getDobOfSomeoneWhoTurns(healthCheckMaximumAge), -1), // someone who is healthCheckMaximumAge years and 1 day old
      increaseDateByDays(getDobOfSomeoneWhoTurns(healthCheckMaximumAge + 1), 1) // someone who turns (healthCheckMaximumAge + 1) tomorrow
    ])(
      'returns PASS when patient is eligible (patient ods code is enabled their age is within threshold) and is a new user  - date of birth: %s',
      async (dateOfBirth) => {
        healthCheckDbClientStub.getHealthChecksByNhsNumber.resolves([
          healthCheck
        ]);
        const result = await service.checkPatientEligibilityToLogIn(
          {
            patientGpOdsCode: enabledOdsCode,
            nhsNumber: testNhsNumber,
            patientId: testPatientId,
            birthDate: formatDateOfBirth(dateOfBirth)
          },
          validIdentityLevel,
          {}
        );
        expect(
          healthCheckDbClientStub.getHealthChecksByNhsNumber.called
        ).toBeTruthy();
        expect(result).toEqual(HealthCheckEligibilityStatus.PASS);
        expect(odsCodesDbClientStub.getOdsCodeStatus.called).toBeTruthy();

        expect(
          commonsStub.logInfo.calledWithExactly(
            serviceClassName,
            'Patient is eligible for health check',
            {}
          )
        ).toBeTruthy();
        expect(
          eventsQueueClientStub.createEvent.calledOnceWithExactly({
            id: mockUUID,
            eventType: AuditEventType.PatientLoggedIn,
            nhcVersion: testNhcVersion,
            nhsNumber: testNhsNumber,
            odsCode: enabledOdsCode,
            patientId: testPatientId,
            healthCheckId: healthCheck.id,
            hcDataModelVersion: healthCheck.dataModelVersion
          })
        ).toBeTruthy();
      }
    );

    test.each([
      getDobOfSomeoneWhoTurns(healthCheckMinimumAge - 5),
      getDobOfSomeoneWhoTurns(healthCheckMinimumAge - 10),
      increaseDateByDays(getDobOfSomeoneWhoTurns(healthCheckMinimumAge), 1) // someone who turns healthCheckMinimumAge tomorrow
    ])(
      'returns FAIL_PATIENT_UNDER_REQUIRED_AGE when patient is too young to login and take health check - date of birth: %s',
      async (dateOfBirth) => {
        healthCheckDbClientStub.getHealthChecksByNhsNumber.resolves([
          healthCheck
        ]);
        const result = await service.checkPatientEligibilityToLogIn(
          {
            patientGpOdsCode: enabledOdsCode,
            nhsNumber: testNhsNumber,
            patientId: testPatientId,
            birthDate: formatDateOfBirth(dateOfBirth)
          },
          validIdentityLevel,
          {}
        );
        expect(result).toEqual(
          HealthCheckEligibilityStatus.FAIL_PATIENT_UNDER_REQUIRED_AGE
        );
        expect(
          eventsQueueClientStub.createEvent.calledOnceWithExactly({
            id: mockUUID,
            eventType: AuditEventType.PatientIneligibleUnderAgeThreshold,
            nhcVersion: testNhcVersion,
            nhsNumber: testNhsNumber,
            odsCode: enabledOdsCode,
            patientId: testPatientId,
            healthCheckId: undefined,
            hcDataModelVersion: undefined
          })
        ).toBeTruthy();
      }
    );

    test('returns FAIL_ODS_CODE_DISABLED when patient ods code is not on the allowed list', async () => {
      healthCheckDbClientStub.getHealthChecksByNhsNumber.resolves([]);
      const result = await service.checkPatientEligibilityToLogIn(
        {
          patientGpOdsCode: disabledOdsCode,
          nhsNumber: testNhsNumber,
          patientId: testPatientId,
          birthDate: formatDateOfBirth(
            getDobOfSomeoneWhoTurns(healthCheckMinimumAge)
          )
        },
        validIdentityLevel,
        {}
      );
      expect(result).toEqual(
        HealthCheckEligibilityStatus.FAIL_ODS_CODE_DISABLED
      );
      expect(odsCodesDbClientStub.getOdsCodeStatus.called).toBeTruthy();

      expect(
        eventsQueueClientStub.createEvent.calledOnceWithExactly({
          id: mockUUID,
          eventType: AuditEventType.PatientIneligibleOdsCodeDisabled,
          nhcVersion: testNhcVersion,
          nhsNumber: testNhsNumber,
          odsCode: disabledOdsCode,
          patientId: testPatientId,
          healthCheckId: undefined,
          hcDataModelVersion: undefined
        })
      ).toBeTruthy();
      expect(
        commonsStub.logInfo.calledWith(
          serviceClassName,
          'Patient is not eligible for health check as the gp ods code is not on the allowed list',
          { gpOdsCode: disabledOdsCode }
        )
      ).toBeTruthy();
    });

    test('returns FAIL_NHS_NUMBER_NOT_ALLOWED when patient nhs number is not on the allowed list', async () => {
      healthCheckDbClientStub.getHealthChecksByNhsNumber.resolves([]);
      const result = await service.checkPatientEligibilityToLogIn(
        {
          patientGpOdsCode: enabledOdsCode,
          nhsNumber: testNotAllowedNhsNumber,
          patientId: testPatientId,
          birthDate: formatDateOfBirth(
            getDobOfSomeoneWhoTurns(healthCheckMinimumAge)
          )
        },
        validIdentityLevel,
        {}
      );
      expect(result).toEqual(
        HealthCheckEligibilityStatus.FAIL_NHS_NUMBER_NOT_ALLOWED
      );
      expect(odsCodesDbClientStub.getOdsCodeStatus.called).toBeTruthy();

      expect(
        eventsQueueClientStub.createEvent.calledOnceWithExactly({
          id: mockUUID,
          eventType: AuditEventType.PatientIneligibleInvalidNHSNumber,
          nhcVersion: testNhcVersion,
          nhsNumber: testNotAllowedNhsNumber,
          odsCode: enabledOdsCode,
          patientId: testPatientId,
          healthCheckId: undefined,
          hcDataModelVersion: undefined
        })
      ).toBeTruthy();
      expect(
        commonsStub.logInfo.calledWith(
          serviceClassName,
          'Is patient NHS number on the allowed list',
          { isPatientOnAllowedList: false }
        )
      ).toBeTruthy();
    });

    test('returns PASS when patient nhs number is not on the allowed list, but enableNhsNumberCheck is false', async () => {
      const mockParameters: HealthCheckEligibilityServiceParams = {
        healthCheckMinimumAge,
        healthCheckMaximumAge,
        healthCheckDbClient: healthCheckDbClientStub,
        s3Client: s3ClientStub,
        enableNhsNumberCheck: false,
        selectedCohortBucketName: bucketName,
        odsCodesDbClient: odsCodesDbClientStub,
        eventsQueueClientService: eventsQueueClientStub
      };
      service = new HealthCheckEligibilityService(
        commonsStub as unknown as Commons,
        mockParameters
      );
      healthCheckDbClientStub.getHealthChecksByNhsNumber.resolves([]);
      const result = await service.checkPatientEligibilityToLogIn(
        {
          patientGpOdsCode: enabledOdsCode,
          nhsNumber: testNotAllowedNhsNumber,
          patientId: testPatientId,
          birthDate: formatDateOfBirth(
            getDobOfSomeoneWhoTurns(healthCheckMinimumAge)
          )
        },
        validIdentityLevel,
        {}
      );

      expect(result).toEqual(HealthCheckEligibilityStatus.PASS);
      expect(odsCodesDbClientStub.getOdsCodeStatus.called).toBeTruthy();

      sandbox.assert.calledOnceWithExactly(eventsQueueClientStub.createEvent, {
        id: mockUUID,
        eventType: AuditEventType.PatientLoggedIn,
        nhcVersion: testNhcVersion,
        nhsNumber: testNotAllowedNhsNumber,
        odsCode: enabledOdsCode,
        patientId: testPatientId,
        healthCheckId: undefined,
        hcDataModelVersion: undefined
      });
    });

    test('returns INELIGIBLE_IDENTITY_PROOFING_LEVEL when patient identity proofing level is below p9', async () => {
      healthCheckDbClientStub.getHealthChecksByNhsNumber.resolves([]);
      const result = await service.checkPatientEligibilityToLogIn(
        {
          patientGpOdsCode: enabledOdsCode,
          nhsNumber: testNhsNumber,
          patientId: testPatientId,
          birthDate: formatDateOfBirth(
            getDobOfSomeoneWhoTurns(healthCheckMinimumAge + 2)
          )
        },
        invalidIdentityLevel,
        {}
      );
      expect(result).toEqual(
        HealthCheckEligibilityStatus.INELIGIBLE_IDENTITY_PROOFING_LEVEL
      );

      expect(
        eventsQueueClientStub.createEvent.calledOnceWithExactly({
          id: mockUUID,
          eventType:
            AuditEventType.PatientIneligibleInsufficientIdentityProofingLevel,
          nhcVersion: testNhcVersion,
          nhsNumber: testNhsNumber,
          odsCode: enabledOdsCode,
          patientId: testPatientId,
          healthCheckId: undefined,
          hcDataModelVersion: undefined
        })
      ).toBeTruthy();
    });

    test.each([
      getDobOfSomeoneWhoTurns(healthCheckMaximumAge + 5),
      getDobOfSomeoneWhoTurns(healthCheckMaximumAge + 10),
      getDobOfSomeoneWhoTurns(healthCheckMaximumAge + 1)
    ])(
      'returns FAIL_PATIENT_OVER_REQUIRED_AGE when patient is too old to login and is a new user - date of birth: %s',

      async (dateOfBirth) => {
        const result = await service.checkPatientEligibilityToLogIn(
          {
            patientGpOdsCode: enabledOdsCode,
            nhsNumber: testNhsNumber,
            patientId: testPatientId,
            birthDate: formatDateOfBirth(dateOfBirth)
          },
          validIdentityLevel,
          {}
        );

        expect(result).toEqual(
          HealthCheckEligibilityStatus.FAIL_PATIENT_OVER_REQUIRED_AGE
        );
        expect(
          eventsQueueClientStub.createEvent.calledOnceWithExactly({
            id: mockUUID,
            eventType: AuditEventType.PatientIneligibleAboveAgeThreshold,
            nhcVersion: testNhcVersion,
            nhsNumber: testNhsNumber,
            odsCode: enabledOdsCode,
            patientId: testPatientId,
            healthCheckId: undefined,
            hcDataModelVersion: undefined
          })
        ).toBeTruthy();
      }
    );

    test.each([
      getDobOfSomeoneWhoTurns(healthCheckMaximumAge + 5),
      getDobOfSomeoneWhoTurns(healthCheckMaximumAge + 10),
      getDobOfSomeoneWhoTurns(healthCheckMaximumAge + 1)
    ])(
      'returns PASS when patient is over maximum age but with existing health check - date of birth : %s',
      async (dateOfBirth) => {
        healthCheckDbClientStub.getHealthChecksByNhsNumber.resolves([
          healthCheck
        ]);
        const result = await service.checkPatientEligibilityToLogIn(
          {
            patientGpOdsCode: enabledOdsCode,
            nhsNumber: testNhsNumber,
            patientId: testPatientId,
            birthDate: formatDateOfBirth(dateOfBirth)
          },
          validIdentityLevel,
          {}
        );

        expect(result).toEqual(HealthCheckEligibilityStatus.PASS);
        sandbox.assert.calledOnceWithExactly(
          eventsQueueClientStub.createEvent,
          {
            id: mockUUID,
            eventType: AuditEventType.PatientLoggedIn,
            nhcVersion: testNhcVersion,
            nhsNumber: testNhsNumber,
            odsCode: enabledOdsCode,
            patientId: testPatientId,
            healthCheckId: healthCheck.id,
            hcDataModelVersion: healthCheck.dataModelVersion
          }
        );
      }
    );

    describe('PatientLoggedIn audit event includes urlSource when provided', () => {
      test.each([
        { urlSource: 'a', expected: undefined },
        { urlSource: 'A', expected: undefined },
        { urlSource: 'AB', expected: 'AB' },
        { urlSource: 'ab', expected: 'AB' },
        { urlSource: 'bC', expected: 'BC' },
        { urlSource: 'a-', expected: undefined },
        { urlSource: '*/', expected: undefined },
        { urlSource: '@i)O', expected: undefined },
        { urlSource: '2h', expected: undefined },
        { urlSource: 'tooLong', expected: undefined },
        { urlSource: ' ', expected: undefined },
        { urlSource: undefined, expected: undefined }
      ])('includes urlSource value: "%s"', async ({ urlSource, expected }) => {
        const mockParameters: HealthCheckEligibilityServiceParams = {
          healthCheckMinimumAge,
          healthCheckMaximumAge,
          healthCheckDbClient: healthCheckDbClientStub,
          s3Client: s3ClientStub,
          enableNhsNumberCheck: false,
          selectedCohortBucketName: bucketName,
          odsCodesDbClient: odsCodesDbClientStub,
          eventsQueueClientService: eventsQueueClientStub
        };
        service = new HealthCheckEligibilityService(
          commonsStub as unknown as Commons,
          mockParameters
        );
        healthCheckDbClientStub.getHealthChecksByNhsNumber.resolves([]);
        const result = await service.checkPatientEligibilityToLogIn(
          {
            patientGpOdsCode: enabledOdsCode,
            nhsNumber: testNotAllowedNhsNumber,
            patientId: testPatientId,
            birthDate: formatDateOfBirth(
              getDobOfSomeoneWhoTurns(healthCheckMinimumAge)
            )
          },
          validIdentityLevel,
          { urlSource }
        );

        expect(result).toEqual(HealthCheckEligibilityStatus.PASS);
        expect(odsCodesDbClientStub.getOdsCodeStatus.called).toBeTruthy();

        sandbox.assert.calledOnceWithExactly(
          eventsQueueClientStub.createEvent,
          {
            id: mockUUID,
            eventType: AuditEventType.PatientLoggedIn,
            nhcVersion: testNhcVersion,
            nhsNumber: testNotAllowedNhsNumber,
            odsCode: enabledOdsCode,
            patientId: testPatientId,
            healthCheckId: undefined,
            hcDataModelVersion: undefined,
            ...(expected !== undefined && { details: { urlSource: expected } })
          }
        );
      });
    });
  });
});
