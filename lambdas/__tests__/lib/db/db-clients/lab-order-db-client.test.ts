import { Commons } from '../../../../src/lib/commons';
import { DbClient } from '../../../../src/lib/db/db-client';
import { LabOrderDbClient } from '../../../../src/lib/db/db-clients/lab-order-db-client';
import { DbTable } from '../../../../src/lib/db/db-tables';
import Sinon from 'ts-sinon';
import {
  LabTestType,
  type ILabOrder
} from '@dnhc-health-checks/shared/model/lab-order';

describe('LabOrderDbClient tests', () => {
  const sandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let dbClientStub: Sinon.SinonStubbedInstance<DbClient>;
  let labOrderDbClient: LabOrderDbClient;
  const healthCheckId = 'id';

  const labOrder: Partial<ILabOrder> = {
    id: healthCheckId,
    healthCheckId: '12345',
    testTypes: [LabTestType.Cholesterol, LabTestType.HbA1c]
  };

  const labOrders = [
    { id: 'id1', testTypes: [LabTestType.Cholesterol] },
    { id: 'id1', testTypes: [LabTestType.HbA1c] }
  ] as ILabOrder[];

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    dbClientStub = sandbox.createStubInstance(DbClient);
    labOrderDbClient = new LabOrderDbClient(
      commonsStub as unknown as Commons,
      dbClientStub as unknown as DbClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('createNewOrder method tests', () => {
    test('should be able to successfully create a new lab order and log success', async () => {
      await labOrderDbClient.createNewOrder(labOrder);
      expect(
        dbClientStub.createRecord.calledOnceWithExactly({
          table: DbTable.LabOrders,
          item: labOrder
        })
      ).toBeTruthy();
    });

    test('should throw an error for an unsuccessful order', async () => {
      const exception = new Error('could not place an order for health check');
      dbClientStub.createRecord.throwsException(exception);

      await expect(labOrderDbClient.createNewOrder(labOrder)).rejects.toThrow(
        exception
      );
      expect(
        dbClientStub.createRecord.calledOnceWithExactly({
          table: DbTable.LabOrders,
          item: labOrder
        })
      ).toBeTruthy();
    });
  });

  describe('updateOrder method tests', () => {
    test('should update a order successfully and log success', async () => {
      await labOrderDbClient.updateOrder('12345', labOrder);

      expect(
        dbClientStub.updateRecordProperties.calledOnceWithExactly({
          table: DbTable.LabOrders,
          partitionKeyValue: '12345',
          updates: labOrder
        })
      ).toBeTruthy();
    });

    test('should throw error when failing to update order', async () => {
      const exception = new Error('failed to update health check order');
      dbClientStub.updateRecordProperties.throwsException(exception);

      await expect(
        labOrderDbClient.updateOrder('12345', labOrder)
      ).rejects.toThrow(exception);
      expect(
        dbClientStub.updateRecordProperties.calledOnceWithExactly({
          table: DbTable.LabOrders,
          partitionKeyValue: '12345',
          updates: labOrder
        })
      ).toBeTruthy();
    });
  });

  describe('deleteOrder', () => {
    test('should be able to successfully delete a new lab order', async () => {
      await labOrderDbClient.deleteOrder(healthCheckId);
      expect(
        dbClientStub.deleteRecord.calledOnceWithExactly({
          table: DbTable.LabOrders,
          partitionKeyValue: healthCheckId
        })
      ).toBeTruthy();
    });

    test('should throw an error for an unsuccessful delete', async () => {
      const exception = new Error('could not delete an order for health check');
      dbClientStub.deleteRecord.throwsException(exception);

      await expect(labOrderDbClient.deleteOrder(healthCheckId)).rejects.toThrow(
        exception
      );
      expect(
        dbClientStub.deleteRecord.calledOnceWithExactly({
          table: DbTable.LabOrders,
          partitionKeyValue: healthCheckId
        })
      ).toBeTruthy();
    });
  });

  describe('getOrdersForHealthCheck', () => {
    test('should be able to successfully retrieve lab orders for given id', async () => {
      dbClientStub.getRecordsByPartitionKey.resolves(labOrders);
      const results =
        await labOrderDbClient.getOrdersForHealthCheck(healthCheckId);
      expect(
        dbClientStub.getRecordsByPartitionKey.calledOnceWithExactly({
          table: DbTable.LabOrders,
          partitionKeyName: 'healthCheckId',
          partitionKeyValue: healthCheckId,
          indexName: 'healthCheckIdIndex'
        })
      ).toBeTruthy();
      expect(results).toEqual(labOrders);
    });

    test('should throw an error for an unsuccessful search by health check id', async () => {
      const exception = new Error('could not search an order for health check');
      dbClientStub.getRecordsByPartitionKey.throwsException(exception);

      await expect(
        labOrderDbClient.getOrdersForHealthCheck(healthCheckId)
      ).rejects.toThrow(exception);
      expect(
        dbClientStub.getRecordsByPartitionKey.calledOnceWithExactly({
          table: DbTable.LabOrders,
          partitionKeyName: 'healthCheckId',
          partitionKeyValue: healthCheckId,
          indexName: 'healthCheckIdIndex'
        })
      ).toBeTruthy();
    });
  });
});
