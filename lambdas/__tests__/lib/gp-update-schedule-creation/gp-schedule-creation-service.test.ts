import Sinon from 'ts-sinon';
import { Commons } from '../../../src/lib/commons';
import { GpScheduleCreationService } from '../../../src/lib/gp-update-schedule-creation/gp-schedule-creation-service';
import { GpUpdateSchedulerDbClient } from '../../../src/lib/db/db-clients/gp-update-scheduler-db-client';
import {
  GpUpdateReason,
  GpUpdateStatus
} from '../../../src/lib/models/gp-update/gp-update-scheduler';

const uuid = '123456789';
jest.mock('uuid', () => ({ v4: () => uuid }));

const mockDate = '2024-04-23T11:23:12.123Z';
jest.useFakeTimers().setSystemTime(Date.parse(mockDate));

describe('gp-schedule-creation-service', () => {
  const sandbox = Sinon.createSandbox();
  let gpUpdateSchedulerDbClientMock: Sinon.SinonStubbedInstance<GpUpdateSchedulerDbClient>;
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let gpScheduleCreationService: GpScheduleCreationService;
  const healthCheckId = '123123';

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    commonsStub.nhcVersion = '1.0';

    gpUpdateSchedulerDbClientMock = sandbox.createStubInstance(
      GpUpdateSchedulerDbClient
    );
    gpScheduleCreationService = new GpScheduleCreationService(
      commonsStub as unknown as Commons,
      gpUpdateSchedulerDbClientMock
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('scheduleGpUpdate', () => {
    test('Updates the GP scheduler DB with correct data', async () => {
      const result = await gpScheduleCreationService.scheduleGpUpdate(
        healthCheckId,
        GpUpdateReason.auditScore
      );

      const expectedGpSchedule = {
        scheduleId: uuid,
        scheduleReason: GpUpdateReason.auditScore,
        healthCheckId,
        status: GpUpdateStatus.New,
        createdAt: mockDate
      };

      sandbox.assert.calledOnceWithExactly(
        gpUpdateSchedulerDbClientMock.insertGpUpdateTask,
        expectedGpSchedule
      );
      expect(result).toEqual(expectedGpSchedule);
    });
  });
});
