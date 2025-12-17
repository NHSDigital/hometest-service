import Sinon from 'ts-sinon';
import { Commons } from '../../../src/lib/commons';
import { HealthCheckVersionMigrationService } from '../../../src/lib/migration/health-check-version-migration-service';
import { type IHealthCheck, AuditEventType } from '@dnhc-health-checks/shared';
import { HealthCheckDbClient } from '../../../src/lib/db/db-clients/health-checks-db-client';
import { EventsQueueClientService } from '../../../src/lib/events/events-queue-client-service';
import * as uuid from 'uuid';

jest.mock('uuid');
const mockUUID = 'mockUUID';
jest.spyOn(uuid, 'v4').mockReturnValue(mockUUID);

const mockDate = '2024-04-23T11:23:12.123Z';
jest.useFakeTimers().setSystemTime(Date.parse(mockDate));

const mockHealthCheckVersionOld = '1.0.0';
const mockHealthCheckVersionNew = '2.0.0';
const odsCode = 'GP1234';
const nhcVersion = 'nhcVersion';
const mockNhsNumber = 'ABCDEF0001';
const healthCheckID = '12345';
const serviceClassName = 'HealthCheckVersionMigrationService';

describe('health-check-version-migration-service', () => {
  const sandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;

  let healthCheckDbClientMock: Sinon.SinonStubbedInstance<HealthCheckDbClient>;
  let eventsQueueClientServiceMock: Sinon.SinonStubbedInstance<EventsQueueClientService>;
  let service: HealthCheckVersionMigrationService;

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    commonsStub.healthCheckDataModelVersion = mockHealthCheckVersionNew;
    commonsStub.nhcVersion = nhcVersion;
    healthCheckDbClientMock = sandbox.createStubInstance(HealthCheckDbClient);
    eventsQueueClientServiceMock = sandbox.createStubInstance(
      EventsQueueClientService
    );

    service = new HealthCheckVersionMigrationService(
      commonsStub as unknown as Commons,
      healthCheckDbClientMock,
      eventsQueueClientServiceMock
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('runMigration: Existing User', () => {
    test('User with health check version 1.0.0 gets updated to 2.0.0, no version history, about you section started', async () => {
      const healthCheck: IHealthCheck = {
        id: healthCheckID,
        dataModelVersion: mockHealthCheckVersionOld,
        nhsNumber: mockNhsNumber,
        createdAt: '2021-01-01T00:00:00Z',
        questionnaire: {
          isAboutYouSectionSubmitted: true
        }
      } as unknown as IHealthCheck;

      healthCheckDbClientMock.getHealthChecksByNhsNumber.resolves([
        healthCheck
      ]);

      await service.runMigration(healthCheck, odsCode);

      sandbox.assert.calledWithExactly(
        commonsStub.logInfo,
        serviceClassName,
        `Health Check Version Updated`,
        {
          old: mockHealthCheckVersionOld,
          new: mockHealthCheckVersionNew
        }
      );

      sandbox.assert.calledWithExactly(
        healthCheckDbClientMock.updateHealthCheck,
        healthCheckID,
        {
          dataModelVersion: mockHealthCheckVersionNew,
          dataModelVersionHistory: [
            {
              dataModelVersion: mockHealthCheckVersionOld,
              migrationDate: healthCheck.createdAt
            },
            {
              dataModelVersion: mockHealthCheckVersionNew,
              migrationDate: mockDate
            }
          ],
          questionnaire: { isAboutYouSectionSubmitted: false }
        }
      );

      sandbox.assert.calledWithMatch(eventsQueueClientServiceMock.createEvent, {
        id: mockUUID,
        healthCheckId: healthCheckID,
        nhcVersion,
        eventType: AuditEventType.HealthCheckDataModelVersionUpdated,
        nhsNumber: mockNhsNumber,
        odsCode,
        details: {
          previousDataModelVersion: mockHealthCheckVersionOld
        }
      });
    });
    test('User with health check version 1.0.0 gets updated to 2.0.0, no version history, empty questionnaire', async () => {
      const healthCheck: IHealthCheck = {
        id: healthCheckID,
        dataModelVersion: mockHealthCheckVersionOld,
        nhsNumber: mockNhsNumber,
        createdAt: '2021-01-01T00:00:00Z'
      } as unknown as IHealthCheck;

      healthCheckDbClientMock.getHealthChecksByNhsNumber.resolves([
        healthCheck
      ]);

      await service.runMigration(healthCheck, odsCode);

      sandbox.assert.calledWithExactly(
        commonsStub.logInfo,
        serviceClassName,
        `Health Check Version Updated`,
        {
          old: mockHealthCheckVersionOld,
          new: mockHealthCheckVersionNew
        }
      );

      sandbox.assert.calledWithExactly(
        healthCheckDbClientMock.updateHealthCheck,
        healthCheckID,
        {
          dataModelVersion: mockHealthCheckVersionNew,
          dataModelVersionHistory: [
            {
              dataModelVersion: mockHealthCheckVersionOld,
              migrationDate: healthCheck.createdAt
            },
            {
              dataModelVersion: mockHealthCheckVersionNew,
              migrationDate: mockDate
            }
          ],
          questionnaire: {}
        }
      );

      sandbox.assert.calledWithMatch(eventsQueueClientServiceMock.createEvent, {
        id: mockUUID,
        healthCheckId: healthCheckID,
        nhcVersion,
        eventType: AuditEventType.HealthCheckDataModelVersionUpdated,
        nhsNumber: mockNhsNumber,
        odsCode,
        details: {
          previousDataModelVersion: mockHealthCheckVersionOld
        }
      });
    });

    test('User with health check version 1.0.0 gets updated to 2.0.0, no version history, about you section not started', async () => {
      const healthCheck: IHealthCheck = {
        id: healthCheckID,
        dataModelVersion: mockHealthCheckVersionOld,
        nhsNumber: mockNhsNumber,
        createdAt: '2021-01-01T00:00:00Z',
        questionnaire: {
          hasCompletedHealthCheckInLast5Years: false
        }
      } as unknown as IHealthCheck;

      healthCheckDbClientMock.getHealthChecksByNhsNumber.resolves([
        healthCheck
      ]);

      await service.runMigration(healthCheck, odsCode);

      sandbox.assert.calledWithExactly(
        commonsStub.logInfo,
        serviceClassName,
        `Health Check Version Updated`,
        {
          old: mockHealthCheckVersionOld,
          new: mockHealthCheckVersionNew
        }
      );

      sandbox.assert.calledWithExactly(
        healthCheckDbClientMock.updateHealthCheck,
        healthCheckID,
        {
          dataModelVersion: mockHealthCheckVersionNew,
          dataModelVersionHistory: [
            {
              dataModelVersion: mockHealthCheckVersionOld,
              migrationDate: healthCheck.createdAt
            },
            {
              dataModelVersion: mockHealthCheckVersionNew,
              migrationDate: mockDate
            }
          ],
          questionnaire: { hasCompletedHealthCheckInLast5Years: false }
        }
      );

      sandbox.assert.calledWithMatch(eventsQueueClientServiceMock.createEvent, {
        id: mockUUID,
        healthCheckId: healthCheckID,
        nhcVersion,
        eventType: AuditEventType.HealthCheckDataModelVersionUpdated,
        nhsNumber: mockNhsNumber,
        odsCode,
        details: {
          previousDataModelVersion: mockHealthCheckVersionOld
        }
      });
    });

    test('User with a versionHistroy already and an outdated health check version gets updated successfully', async () => {
      const oldVersion = '1.5.2';
      const dataModelVersionHistory = [
        {
          dataModelVersion: oldVersion,
          migrationDate: '2021-01-01T00:00:00Z'
        }
      ];
      const healthCheck: IHealthCheck = {
        id: healthCheckID,
        dataModelVersion: oldVersion,
        nhsNumber: mockNhsNumber,
        dataModelVersionHistory,
        createdAt: '2021-01-01T00:00:00Z',
        questionnaire: {
          isAboutYouSectionSubmitted: true
        }
      } as unknown as IHealthCheck;

      healthCheckDbClientMock.getHealthChecksByNhsNumber.resolves([
        healthCheck
      ]);

      await service.runMigration(healthCheck, odsCode);

      sandbox.assert.calledWithExactly(
        commonsStub.logInfo,
        serviceClassName,
        'Health Check Version Updated',
        {
          old: oldVersion,
          new: mockHealthCheckVersionNew
        }
      );

      sandbox.assert.calledWithExactly(
        healthCheckDbClientMock.updateHealthCheck,
        healthCheckID,
        {
          dataModelVersion: mockHealthCheckVersionNew,
          dataModelVersionHistory: [
            {
              dataModelVersion: oldVersion,
              migrationDate: dataModelVersionHistory[0].migrationDate
            },
            {
              dataModelVersion: mockHealthCheckVersionNew,
              migrationDate: mockDate
            }
          ],
          questionnaire: { isAboutYouSectionSubmitted: false }
        }
      );

      sandbox.assert.calledWithMatch(eventsQueueClientServiceMock.createEvent, {
        id: mockUUID,
        healthCheckId: healthCheckID,
        nhcVersion,
        eventType: AuditEventType.HealthCheckDataModelVersionUpdated,
        nhsNumber: mockNhsNumber,
        odsCode,
        details: {
          previousDataModelVersion: oldVersion
        }
      });
    });

    test('User with health check version up to date nothing happens', async () => {
      const healthCheck: IHealthCheck = {
        id: healthCheckID,
        dataModelVersion: mockHealthCheckVersionNew,
        nhsNumber: mockNhsNumber,
        createdAt: '2021-01-01T00:00:00Z',
        questionnaire: {
          isAboutYouSectionSubmitted: true
        }
      } as unknown as IHealthCheck;

      healthCheckDbClientMock.getHealthChecksByNhsNumber.resolves([
        healthCheck
      ]);

      await service.runMigration(healthCheck, odsCode);
      sandbox.assert.notCalled(healthCheckDbClientMock.updateHealthCheck);
      sandbox.assert.notCalled(eventsQueueClientServiceMock.createEvent);
    });

    test('User with health check version 1.0.0 gets updated to 3.0.0 successfully', async () => {
      commonsStub.healthCheckDataModelVersion = '3.0.0';
      const healthCheck: IHealthCheck = {
        id: healthCheckID,
        dataModelVersion: mockHealthCheckVersionOld,
        nhsNumber: mockNhsNumber,
        createdAt: '2021-01-01T00:00:00Z',
        questionnaire: {
          isAboutYouSectionSubmitted: true
        }
      } as unknown as IHealthCheck;

      healthCheckDbClientMock.getHealthChecksByNhsNumber.resolves([
        healthCheck
      ]);

      await service.runMigration(healthCheck, odsCode);

      sandbox.assert.calledWithExactly(
        commonsStub.logInfo,
        serviceClassName,
        `Health Check Version Updated`,
        {
          old: mockHealthCheckVersionOld,
          new: '3.0.0'
        }
      );

      sandbox.assert.calledOnceWithExactly(
        healthCheckDbClientMock.updateHealthCheck,
        healthCheckID,
        {
          dataModelVersion: '3.0.0',
          dataModelVersionHistory: [
            {
              dataModelVersion: mockHealthCheckVersionOld,
              migrationDate: healthCheck.createdAt
            },
            {
              dataModelVersion: '3.0.0',
              migrationDate: mockDate
            }
          ],
          questionnaire: { isAboutYouSectionSubmitted: false }
        }
      );

      sandbox.assert.calledWithMatch(eventsQueueClientServiceMock.createEvent, {
        id: mockUUID,
        healthCheckId: healthCheckID,
        nhcVersion,
        eventType: AuditEventType.HealthCheckDataModelVersionUpdated,
        nhsNumber: mockNhsNumber,
        odsCode,
        details: {
          previousDataModelVersion: mockHealthCheckVersionOld
        }
      });
    });
  });

  describe('healthCheckRequireMigration', () => {
    it('should return false when healthcheck version is greater than current version (major)', () => {
      const healthcheck: IHealthCheck = { dataModelVersion: '3.0.0' } as any;
      const currentVersion = '2.0.0';

      expect(service.requireMigration(healthcheck, currentVersion)).toBe(false);
    });

    it('should return false when healthcheck version is less than current version (minor) ', () => {
      const healthcheck: IHealthCheck = { dataModelVersion: '2.0.0' } as any;
      const currentVersion = '2.1.0';

      expect(service.requireMigration(healthcheck, currentVersion)).toBe(false);
    });

    it('should return false when healthcheck version is equal to current version', () => {
      const healthcheck: IHealthCheck = { dataModelVersion: '2.0.0' } as any;
      const currentVersion = '2.0.0';

      expect(service.requireMigration(healthcheck, currentVersion)).toBe(false);
    });

    it('should return true when healthcheck version is less than current version', () => {
      const healthcheck: IHealthCheck = { dataModelVersion: '1.0.0' } as any;
      const currentVersion = '2.0.0';

      expect(service.requireMigration(healthcheck, currentVersion)).toBe(true);
    });
  });
});
