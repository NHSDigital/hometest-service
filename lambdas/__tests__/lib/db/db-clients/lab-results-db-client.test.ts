import { Commons } from '../../../../src/lib/commons';
import { DbClient } from '../../../../src/lib/db/db-client';
import Sinon from 'ts-sinon';
import { LabResultsDbClient } from '../../../../src/lib/db/db-clients/lab-results-db-client';
import { LabTestType, type ILabResult } from '@dnhc-health-checks/shared';
import { DbTable } from '../../../../src/lib/db/db-tables';

describe('LabResultsDbClient tests', () => {
  const sandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let dbClientStub: Sinon.SinonStubbedInstance<DbClient>;
  let labResultsDbClient: LabResultsDbClient;

  const labResult: ILabResult = {
    orderId: '12345',
    fulfilmentOrderId: 'CHE87654321',
    testType: LabTestType.HbA1c,
    healthCheckId: '12345',
    patientId: '12345',
    provider: 'thriva',
    pendingReorder: false,
    receivedAt: '2023-10-01T00:00:00Z',
    resultDate: '2023-10-01T00:00:00Z',
    resultData: []
  };

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    dbClientStub = sandbox.createStubInstance(DbClient);
    labResultsDbClient = new LabResultsDbClient(
      commonsStub as unknown as Commons,
      dbClientStub as unknown as DbClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('insertLabResult method tests', () => {
    test('should insert a valid lab result', async () => {
      await labResultsDbClient.insertLabResult(labResult);
      expect(
        dbClientStub.createRecord.calledOnceWithExactly({
          table: DbTable.LabResults,
          item: labResult,
          conditionExpression:
            'attribute_not_exists(orderId) AND attribute_not_exists(testType)'
        })
      ).toBeTruthy();
    });

    test('should throw a error when insert lab result failed', async () => {
      const exception = new Error('lab result could not be saved');
      dbClientStub.createRecord.throwsException(exception);

      await expect(
        labResultsDbClient.insertLabResult(labResult)
      ).rejects.toThrow(exception);
      expect(
        dbClientStub.createRecord.calledOnceWithExactly({
          table: DbTable.LabResults,
          item: labResult,
          conditionExpression:
            'attribute_not_exists(orderId) AND attribute_not_exists(testType)'
        })
      ).toBeTruthy();
    });
  });

  describe('getResultsForHealthCheck method test', () => {
    test('should return valid results from health check', async () => {
      await labResultsDbClient.getResultsForHealthCheck('12345');

      expect(
        dbClientStub.getRecordsByPartitionKey.calledOnceWithExactly({
          table: DbTable.LabResults,
          partitionKeyName: 'healthCheckId',
          partitionKeyValue: '12345',
          indexName: 'healthCheckIdIndex'
        })
      ).toBeTruthy();
    });

    test('should return invalid, throwing an error', async () => {
      const exception = new Error('could not get health check results by id');
      dbClientStub.getRecordsByPartitionKey.throwsException(exception);

      await expect(
        labResultsDbClient.getResultsForHealthCheck('12345')
      ).rejects.toThrow(exception);
      expect(
        dbClientStub.getRecordsByPartitionKey.calledOnceWithExactly({
          table: DbTable.LabResults,
          partitionKeyName: 'healthCheckId',
          partitionKeyValue: '12345',
          indexName: 'healthCheckIdIndex'
        })
      ).toBeTruthy();
    });
  });

  describe('deleteResult', () => {
    const id = '12345';
    const testType = LabTestType.Cholesterol;

    test('should delete results from with id and testType', async () => {
      await labResultsDbClient.deleteResult(id, testType);

      sandbox.assert.calledOnceWithExactly(dbClientStub.deleteRecord, {
        table: DbTable.LabResults,
        partitionKeyValue: id,
        sortKeyValue: testType
      });
    });

    test('should re-throw an error when deletion was unsuccessful', async () => {
      const exception = new Error('could not delete lab results for patient');
      dbClientStub.deleteRecord.throwsException(exception);

      await expect(
        labResultsDbClient.deleteResult(id, testType)
      ).rejects.toThrow(exception);

      sandbox.assert.calledOnceWithExactly(dbClientStub.deleteRecord, {
        table: DbTable.LabResults,
        partitionKeyValue: id,
        sortKeyValue: testType
      });
    });
  });
});
