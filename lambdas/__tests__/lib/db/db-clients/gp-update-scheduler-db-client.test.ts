import { Commons } from '../../../../src/lib/commons';
import { DbClient } from '../../../../src/lib/db/db-client';
import { GpUpdateSchedulerDbClient } from '../../../../src/lib/db/db-clients/gp-update-scheduler-db-client';
import { DbTable } from '../../../../src/lib/db/db-tables';
import {
  GpUpdateReason,
  GpUpdateStatus,
  type IGpUpdateScheduler
} from '../../../../src/lib/models/gp-update/gp-update-scheduler';
import Sinon from 'ts-sinon';

describe('GpUpdateSchedulerDbClient', () => {
  const sandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let dbClientStub: Sinon.SinonStubbedInstance<DbClient>;
  let service: GpUpdateSchedulerDbClient;

  const testUpdateSchedule: IGpUpdateScheduler = {
    scheduleId: 'eb69f9f3-f994-4852-a924-1dd182e03cec',
    healthCheckId: '12345',
    scheduleReason: GpUpdateReason.auditScore,
    status: GpUpdateStatus.New,
    createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    dbClientStub = sandbox.createStubInstance(DbClient);

    service = new GpUpdateSchedulerDbClient(
      commonsStub as unknown as Commons,
      dbClientStub as unknown as DbClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('insertGpUpdateTask', () => {
    it('When creation of update task is successful then a log should be produced', async () => {
      await service.insertGpUpdateTask(testUpdateSchedule);

      sandbox.assert.calledOnceWithExactly(dbClientStub.createRecord, {
        table: DbTable.GpUpdateScheduler,
        item: testUpdateSchedule
      });
    });

    it('When creation of gp update schedule is unsuccessful then the error should be rethrown', async () => {
      const exception = new Error('There is no (up) date with GP!');
      dbClientStub.createRecord.throwsException(exception);

      await expect(
        service.insertGpUpdateTask(testUpdateSchedule)
      ).rejects.toThrow(exception);

      sandbox.assert.calledOnceWithExactly(dbClientStub.createRecord, {
        table: DbTable.GpUpdateScheduler,
        item: testUpdateSchedule
      });
    });
  });

  describe('getGpUpdateTaskById', () => {
    test('should search for a gp update schedule successfully using id', async () => {
      await service.getGpUpdateTaskById(testUpdateSchedule.scheduleId);

      expect(
        dbClientStub.getRecordById.calledOnceWithExactly({
          table: DbTable.GpUpdateScheduler,
          partitionKeyValue: testUpdateSchedule.scheduleId
        })
      ).toBeTruthy();
    });

    test('should throw error for invalid scheduleId', async () => {
      const exception = new Error('could not get task');
      dbClientStub.getRecordById.throwsException(exception);

      await expect(
        service.getGpUpdateTaskById(testUpdateSchedule.scheduleId)
      ).rejects.toThrow(exception);

      expect(
        dbClientStub.getRecordById.calledOnceWithExactly({
          table: DbTable.GpUpdateScheduler,
          partitionKeyValue: testUpdateSchedule.scheduleId
        })
      ).toBeTruthy();
    });
  });

  describe('getGpUpdateTasksByHealthCheckId', () => {
    test('should return gp update schedules filtered by health check id successfully', async () => {
      const mockResults = [
        testUpdateSchedule,
        {
          ...testUpdateSchedule,
          scheduleId: '98765'
        }
      ];
      dbClientStub.getRecordsByPartitionKey.resolves(mockResults);

      const result = await service.getGpUpdateTasksByHealthCheckId(
        testUpdateSchedule.healthCheckId
      );

      expect(
        dbClientStub.getRecordsByPartitionKey.calledOnceWithExactly({
          table: DbTable.GpUpdateScheduler,
          partitionKeyName: 'healthCheckId',
          partitionKeyValue: testUpdateSchedule.healthCheckId,
          indexName: 'healthCheckIdIndex'
        })
      ).toBeTruthy();
      expect(result).toBe(mockResults);
    });

    test('should throw error when db client fails', async () => {
      const exception = new Error('could not get tasks for health check id');
      dbClientStub.getRecordsByPartitionKey.throwsException(exception);

      await expect(
        service.getGpUpdateTasksByHealthCheckId(
          testUpdateSchedule.healthCheckId
        )
      ).rejects.toThrow(exception);

      expect(
        dbClientStub.getRecordsByPartitionKey.calledOnceWithExactly({
          table: DbTable.GpUpdateScheduler,
          partitionKeyName: 'healthCheckId',
          partitionKeyValue: testUpdateSchedule.healthCheckId,
          indexName: 'healthCheckIdIndex'
        })
      ).toBeTruthy();
    });
  });

  describe('getAllGpUpdateTasks', () => {
    test('should fetch all gp update schedules', async () => {
      const mockResults = [
        testUpdateSchedule,
        {
          ...testUpdateSchedule,
          scheduleId: '98765'
        }
      ];
      dbClientStub.getAllRecords.resolves(mockResults);

      const result = await service.getAllGpUpdateTasks();

      expect(
        dbClientStub.getAllRecords.calledOnceWithExactly({
          table: DbTable.GpUpdateScheduler
        })
      ).toBeTruthy();
      expect(result).toBe(mockResults);
    });

    test('should throw error when db client fails', async () => {
      const exception = new Error('could not get tasks');
      dbClientStub.getAllRecords.throwsException(exception);

      await expect(service.getAllGpUpdateTasks()).rejects.toThrow(exception);

      expect(
        dbClientStub.getAllRecords.calledOnceWithExactly({
          table: DbTable.GpUpdateScheduler
        })
      ).toBeTruthy();
    });
  });

  describe('updateGpUpdateTask', () => {
    test('should update a gp update schedule successfully', async () => {
      const removals = ['propA', 'propB'];
      const updates = { healthCheckId: '8888' };

      await service.updateGpUpdateTask(
        testUpdateSchedule.scheduleId,
        updates,
        removals
      );

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.updateRecordProperties,
        {
          table: DbTable.GpUpdateScheduler,
          partitionKeyValue: testUpdateSchedule.scheduleId,
          updates,
          removals,
          returnValues: 'ALL_NEW'
        }
      );
    });

    test('should throw error when update is unsuccessful', async () => {
      const updates = { healthCheckId: '8888' };
      const exception = new Error('task could not be updated');
      dbClientStub.updateRecordProperties.throwsException(exception);

      await expect(
        service.updateGpUpdateTask(testUpdateSchedule.scheduleId, updates)
      ).rejects.toThrow(exception);

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.updateRecordProperties,
        {
          table: DbTable.GpUpdateScheduler,
          partitionKeyValue: testUpdateSchedule.scheduleId,
          updates,
          returnValues: 'ALL_NEW'
        }
      );
    });
  });

  describe('deleteGpUpdateTask', () => {
    test('should be able to successfully delete a gp update schedule', async () => {
      await service.deleteGpUpdateTask(testUpdateSchedule.scheduleId);

      expect(
        dbClientStub.deleteRecord.calledOnceWithExactly({
          table: DbTable.GpUpdateScheduler,
          partitionKeyValue: testUpdateSchedule.scheduleId
        })
      ).toBeTruthy();
    });

    test('should throw an error for an unsuccessful delete', async () => {
      const exception = new Error('could not delete task');
      dbClientStub.deleteRecord.throwsException(exception);

      await expect(
        service.deleteGpUpdateTask(testUpdateSchedule.scheduleId)
      ).rejects.toThrow(exception);

      expect(
        dbClientStub.deleteRecord.calledOnceWithExactly({
          table: DbTable.GpUpdateScheduler,
          partitionKeyValue: testUpdateSchedule.scheduleId
        })
      ).toBeTruthy();
    });
  });
});
