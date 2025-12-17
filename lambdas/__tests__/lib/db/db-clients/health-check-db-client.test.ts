import { Commons } from '../../../../src/lib/commons';
import { DbClient } from '../../../../src/lib/db/db-client';
import { HealthCheckDbClient } from '../../../../src/lib/db/db-clients/health-checks-db-client';
import { DbTable } from '../../../../src/lib/db/db-tables';
import {
  AutoExpiryStatus,
  BloodTestExpiryWritebackStatus,
  HealthCheckSteps,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import Sinon from 'ts-sinon';

describe('HealthCheckDbClient tests', () => {
  const sandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let dbClientStub: Sinon.SinonStubbedInstance<DbClient>;
  let hcDbClient: HealthCheckDbClient;
  const serviceClassName = 'HealthCheckDbClient';

  const healthCheck: IHealthCheck = {
    id: '12345',
    nhsNumber: 'nhsNumber'
  } as unknown as IHealthCheck;
  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    dbClientStub = sandbox.createStubInstance(DbClient);
    hcDbClient = new HealthCheckDbClient(
      commonsStub as unknown as Commons,
      dbClientStub as unknown as DbClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('insertHealthCheck method tests', () => {
    test('should insert health check successfully', async () => {
      await hcDbClient.insertHealthCheck(healthCheck);
      expect(
        dbClientStub.createRecord.calledOnceWithExactly({
          table: DbTable.HealthChecks,
          item: healthCheck
        })
      ).toBeTruthy();
    });

    test('should throw error for failed creation', async () => {
      const exception = new Error('could not create a new health check');
      dbClientStub.createRecord.throwsException(exception);
      await expect(hcDbClient.insertHealthCheck(healthCheck)).rejects.toThrow(
        exception
      );
      expect(
        dbClientStub.createRecord.calledOnceWithExactly({
          table: DbTable.HealthChecks,
          item: healthCheck
        })
      ).toBeTruthy();
    });
  });

  describe('getHealthCheckById method tests', () => {
    test('should search for a valid health check successfully using id', async () => {
      await hcDbClient.getHealthCheckById(healthCheck.id);
      expect(
        dbClientStub.getRecordById.calledOnceWithExactly({
          table: DbTable.HealthChecks,
          partitionKeyValue: healthCheck.id
        })
      ).toBeTruthy();
    });

    test('should throw error for invalid health check id', async () => {
      const exception = new Error('could not get health check by id');
      dbClientStub.getRecordById.throwsException(exception);

      await expect(
        hcDbClient.getHealthCheckById(healthCheck.id)
      ).rejects.toThrow(exception);
      expect(
        dbClientStub.getRecordById.calledOnceWithExactly({
          table: DbTable.HealthChecks,
          partitionKeyValue: healthCheck.id
        })
      ).toBeTruthy();
    });
  });

  describe('updateHealthCheck method tests', () => {
    test('should update successfully', async () => {
      const removals = ['propA', 'propB'];
      await hcDbClient.updateHealthCheck('12345', healthCheck, removals);

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.updateRecordProperties,
        {
          table: DbTable.HealthChecks,
          partitionKeyValue: '12345',
          updates: healthCheck as Record<string, any>,
          removals,
          returnValues: 'ALL_NEW'
        }
      );
    });

    test('should throw error when update is unsuccessful', async () => {
      const exception = new Error('health check could not be updated');
      dbClientStub.updateRecordProperties.throwsException(exception);

      await expect(
        hcDbClient.updateHealthCheck('12345', healthCheck)
      ).rejects.toThrow(exception);

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.updateRecordProperties,
        {
          table: DbTable.HealthChecks,
          partitionKeyValue: '12345',
          updates: healthCheck as Record<string, any>,
          returnValues: 'ALL_NEW'
        }
      );
    });
  });

  describe('getHealthChecksByNhsNumber method tests', () => {
    test('should search for a valid health check using nhs number successfully', async () => {
      const mockResults = [
        { id: 'id1', some: 'prop' },
        { id: 'id2', some: 'prop2' }
      ];
      dbClientStub.getRecordsByPartitionKey.resolves(mockResults);

      const result = await hcDbClient.getHealthChecksByNhsNumber('nhsnumber');

      expect(
        dbClientStub.getRecordsByPartitionKey.calledOnceWithExactly({
          table: DbTable.HealthChecks,
          partitionKeyName: 'nhsNumber',
          partitionKeyValue: 'nhsnumber',
          indexName: 'nhsNumberIndex'
        })
      ).toBeTruthy();
      expect(result).toBe(mockResults);
      sandbox.assert.calledWithExactly(
        commonsStub.logDebug.firstCall,
        serviceClassName,
        'Health checks for patient fetched successfully',
        { results: ['id1', 'id2'] }
      );
    });

    test('should throw error for invalid healthcheck nhsnumber', async () => {
      const exception = new Error('could not get health checks for patient');
      dbClientStub.getRecordsByPartitionKey.throwsException(exception);

      await expect(
        hcDbClient.getHealthChecksByNhsNumber('nhsnumber')
      ).rejects.toThrow(exception);

      expect(
        dbClientStub.getRecordsByPartitionKey.calledOnceWithExactly({
          table: DbTable.HealthChecks,
          partitionKeyName: 'nhsNumber',
          partitionKeyValue: 'nhsnumber',
          indexName: 'nhsNumberIndex'
        })
      ).toBeTruthy();
    });
  });

  describe('getHealthChecksByStep', () => {
    test('should search for a valid health check using step successfully', async () => {
      const mockResults = [
        { id: 'id1', some: 'prop' },
        { id: 'id2', some: 'prop2' }
      ];
      dbClientStub.getRecordsByPartitionKey.resolves(mockResults);

      const result = await hcDbClient.getHealthChecksByStep(
        HealthCheckSteps.INIT
      );

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.getRecordsByPartitionKey,
        {
          table: DbTable.HealthChecks,
          partitionKeyName: 'step',
          partitionKeyValue: HealthCheckSteps.INIT,
          indexName: 'stepIndex'
        }
      );
      expect(result).toBe(mockResults);
      sandbox.assert.calledWithExactly(
        commonsStub.logDebug,
        serviceClassName,
        'Health checks for step fetched successfully',
        {
          results: ['id1', 'id2']
        }
      );
    });

    test('should throw error for invalid healthcheck step', async () => {
      const exception = new Error('could not get health checks for step');
      dbClientStub.getRecordsByPartitionKey.throwsException(exception);

      await expect(
        hcDbClient.getHealthChecksByStep(HealthCheckSteps.INIT)
      ).rejects.toThrow(exception);

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.getRecordsByPartitionKey,
        {
          table: DbTable.HealthChecks,
          partitionKeyName: 'step',
          partitionKeyValue: HealthCheckSteps.INIT,
          indexName: 'stepIndex'
        }
      );
    });
  });

  describe('getHealthChecksByStepAndBloodTestExpiryWritebackStatus', () => {
    test('should search for a valid health check using step and bloodTestExpiryWritebackStatus successfully', async () => {
      const mockResults = [
        { id: 'id1', some: 'prop' },
        { id: 'id2', some: 'prop2' }
      ];
      dbClientStub.getRecordsByPartitionKey.resolves(mockResults);

      const result =
        await hcDbClient.getHealthChecksByStepAndBloodTestExpiryWritebackStatus(
          HealthCheckSteps.INIT,
          BloodTestExpiryWritebackStatus.NA
        );

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.getRecordsByPartitionKey,
        {
          table: DbTable.HealthChecks,
          partitionKeyName: 'bloodTestExpiryWritebackStatus',
          partitionKeyValue: BloodTestExpiryWritebackStatus.NA,
          sortKeyName: 'step',
          sortKeyValue: HealthCheckSteps.INIT,
          indexName: 'bloodTestExpiryWritebackStatusStepIndex'
        }
      );
      expect(result).toBe(mockResults);
      sandbox.assert.calledWithExactly(
        commonsStub.logDebug,
        serviceClassName,
        'Health checks for step and bloodTestExpiryWritebackStatus fetched successfully',
        {
          results: ['id1', 'id2']
        }
      );
    });

    test('should throw error for invalid db client response', async () => {
      const exception = new Error('could not get health checks');
      dbClientStub.getRecordsByPartitionKey.throwsException(exception);

      await expect(
        hcDbClient.getHealthChecksByStepAndBloodTestExpiryWritebackStatus(
          HealthCheckSteps.INIT,
          BloodTestExpiryWritebackStatus.NA
        )
      ).rejects.toThrow(exception);

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.getRecordsByPartitionKey,
        {
          table: DbTable.HealthChecks,
          partitionKeyName: 'bloodTestExpiryWritebackStatus',
          partitionKeyValue: BloodTestExpiryWritebackStatus.NA,
          sortKeyName: 'step',
          sortKeyValue: HealthCheckSteps.INIT,
          indexName: 'bloodTestExpiryWritebackStatusStepIndex'
        }
      );
    });
  });

  describe('getHealthChecksByStepAndExpiryStatus', () => {
    test('should search for a valid health check using step and expiryStatus successfully', async () => {
      const mockResults = [
        { id: 'id1', some: 'prop' },
        { id: 'id2', some: 'prop2' }
      ];
      dbClientStub.getRecordsByPartitionKey.resolves(mockResults);

      const result = await hcDbClient.getHealthChecksByStepAndExpiryStatus(
        HealthCheckSteps.AUTO_EXPIRED,
        AutoExpiryStatus.GP_PARTIAL_UPDATE_SUCCESS
      );

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.getRecordsByPartitionKey,
        {
          table: DbTable.HealthChecks,
          partitionKeyName: 'expiryStatus',
          partitionKeyValue: AutoExpiryStatus.GP_PARTIAL_UPDATE_SUCCESS,
          sortKeyName: 'step',
          sortKeyValue: HealthCheckSteps.AUTO_EXPIRED,
          indexName: 'expiryStatusStepIndex'
        }
      );
      expect(result).toBe(mockResults);
      sandbox.assert.calledWithExactly(
        commonsStub.logDebug,
        serviceClassName,
        'Health checks for step and expiryStatus fetched successfully',
        {
          results: ['id1', 'id2']
        }
      );
    });

    test('should throw error for invalid db client response', async () => {
      const exception = new Error('could not get health checks');
      dbClientStub.getRecordsByPartitionKey.throwsException(exception);

      await expect(
        hcDbClient.getHealthChecksByStepAndExpiryStatus(
          HealthCheckSteps.AUTO_EXPIRED,
          AutoExpiryStatus.GP_PARTIAL_UPDATE_SUCCESS
        )
      ).rejects.toThrow(exception);

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.getRecordsByPartitionKey,
        {
          table: DbTable.HealthChecks,
          partitionKeyName: 'expiryStatus',
          partitionKeyValue: AutoExpiryStatus.GP_PARTIAL_UPDATE_SUCCESS,
          sortKeyName: 'step',
          sortKeyValue: HealthCheckSteps.AUTO_EXPIRED,
          indexName: 'expiryStatusStepIndex'
        }
      );
    });
  });
});
