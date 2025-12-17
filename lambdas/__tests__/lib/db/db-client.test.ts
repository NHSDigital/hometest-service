import { Commons } from '../../../src/lib/commons';
import { DbClient } from '../../../src/lib/db/db-client';
import Sinon from 'ts-sinon';
import { DbTable } from '../../../src/lib/db/db-tables';
import {
  type EntityUpdateParams,
  type EntityCreateParams,
  type EntityFetchParams,
  type EntityDeleteParams
} from '../../../src/lib/db/entity-update-params';
import {
  DynamoDBDocument,
  type ScanCommandInput,
  type GetCommandInput,
  type QueryCommandInput,
  type PutCommandInput,
  type UpdateCommandOutput,
  type UpdateCommandInput,
  type BatchWriteCommandInput,
  type DeleteCommandInput
} from '@aws-sdk/lib-dynamodb';
import { type IGpOdsCode } from '../../../src/lib/models/ods-codes/ods-code';
import { type IAuditEvent } from '../../../src/lib/models/events/audit-event';
import { type IBatchInput } from '../../../src/lib/models/data-load/batch-input';
import { LogMethodNames, TestUtil } from '../../util/test-util';
import { ReturnValue } from '@aws-sdk/client-dynamodb';
import { DbRecordNotFoundError } from '../../../src/lib/errors/db-errors';
import {
  AuditEventType,
  type IHealthCheck,
  Sex
} from '@dnhc-health-checks/shared';

describe('DbClient tests', () => {
  const sandbox: Sinon.SinonSandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let dbDocumentClient: Sinon.SinonStubbedInstance<DynamoDBDocument>;
  const serviceClassName = 'DbClient';
  let service: DbClient;
  let testUtil: TestUtil;

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    dbDocumentClient = sandbox.createStubInstance(DynamoDBDocument);
    testUtil = new TestUtil(commonsStub, serviceClassName);

    service = new DbClient(
      commonsStub as unknown as Commons,
      dbDocumentClient as unknown as DynamoDBDocument
    );
  });

  afterEach(() => {
    sandbox.resetHistory();
    sandbox.reset();
  });

  describe('getRecordsByPartitionKey tests', () => {
    const nhsNumber = '1234567890';
    const fetchParams: EntityFetchParams = {
      table: DbTable.HealthChecks,
      partitionKeyName: 'nhsNumber',
      partitionKeyValue: nhsNumber,
      indexName: 'nhsNumberIndex'
    };
    const expectedResult = {
      Items: [{ nhsNumber }],
      Count: 1
    };

    function expectCorrectQueryInvoked(fetchParams: EntityFetchParams): void {
      const queryInput: QueryCommandInput = {
        TableName: `${process.env.ENV_NAME}-nhc-health-check-db`,
        KeyConditionExpression: 'nhsNumber = :partitionKeyValue',
        ExpressionAttributeValues: {
          ':partitionKeyValue': fetchParams.partitionKeyValue
        },
        IndexName: fetchParams.indexName
      };

      expect(dbDocumentClient.query.calledOnce).toBeTruthy();
      expect(dbDocumentClient.query.getCall(0).args[0]).toMatchObject(
        queryInput
      );
    }

    test('When records are fetched successfully by partition key then a log should be produced', async () => {
      dbDocumentClient.query.resolves(expectedResult);

      const result =
        await service.getRecordsByPartitionKey<IHealthCheck>(fetchParams);

      expect(result).toMatchObject(expectedResult.Items);
      expectCorrectQueryInvoked(fetchParams);

      testUtil.expectLogProduced(
        'page of records fetched successfully',
        {
          tableName: `${process.env.ENV_NAME}-nhc-health-check-db`,
          recordsReturned: 1,
          lastEvaluatedKey: undefined
        },
        LogMethodNames.DEBUG,
        1
      );
    });

    test('When records are fetched successfully by partition key and sort key then a log should be produced', async () => {
      const fetchParams: EntityFetchParams = {
        table: DbTable.HealthChecks,
        partitionKeyName: 'nhsNumber',
        partitionKeyValue: nhsNumber,
        sortKeyName: 'step',
        sortKeyValue: 'INIT',
        indexName: 'nhsNumberIndex'
      };
      dbDocumentClient.query.resolves(expectedResult);

      const result =
        await service.getRecordsByPartitionKey<IHealthCheck>(fetchParams);

      expect(result).toMatchObject(expectedResult.Items);
      const queryInput: QueryCommandInput = {
        TableName: `${process.env.ENV_NAME}-nhc-health-check-db`,
        KeyConditionExpression:
          'nhsNumber = :partitionKeyValue AND step = :sortKeyValue',
        ExpressionAttributeValues: {
          ':partitionKeyValue': fetchParams.partitionKeyValue,
          ':sortKeyValue': fetchParams.sortKeyValue
        },
        IndexName: fetchParams.indexName
      };

      expect(dbDocumentClient.query.calledOnce).toBeTruthy();
      expect(dbDocumentClient.query.getCall(0).args[0]).toMatchObject(
        queryInput
      );

      testUtil.expectLogProduced(
        'page of records fetched successfully',
        {
          tableName: `${process.env.ENV_NAME}-nhc-health-check-db`,
          recordsReturned: 1,
          lastEvaluatedKey: undefined
        },
        LogMethodNames.DEBUG,
        1
      );
    });

    test('When records cannot be fetched by partition key then the exception should be rethrown', async () => {
      const exception = new Error('could not fetch records by partition key');
      dbDocumentClient.query.throwsException(exception);

      await expect(
        service.getRecordsByPartitionKey<IHealthCheck>(fetchParams)
      ).rejects.toThrow(exception);

      expectCorrectQueryInvoked(fetchParams);
      testUtil.expectLogProduced(
        'could not fetch records from table',
        {
          error: exception,
          nhsNumber: '*****',
          tableName: `${process.env.ENV_NAME}-nhc-health-check-db`
        },
        LogMethodNames.ERROR
      );
    });
  });

  describe('getRecordById tests', () => {
    const recordId = '12345';
    const fetchParams: EntityFetchParams = {
      table: DbTable.HealthChecks,
      partitionKeyName: 'id',
      partitionKeyValue: recordId,
      indexName: 'idIndex'
    };

    function expectCorrectGetInvoked(): void {
      const commandInput: GetCommandInput = {
        TableName: `${process.env.ENV_NAME}-nhc-health-check-db`,
        Key: { id: recordId }
      };

      expect(dbDocumentClient.get.calledOnce).toBeTruthy();
      expect(dbDocumentClient.get.getCall(0).args[0]).toMatchObject(
        commandInput
      );
    }

    test('When record is fetched successfully then a log should be produced', async () => {
      const expectedResult = {
        Item: { id: recordId }
      };
      dbDocumentClient.get.resolves(expectedResult);

      const result = await service.getRecordById<IHealthCheck>(fetchParams);

      expect(result).toMatchObject(expectedResult.Item);

      expectCorrectGetInvoked();
      testUtil.expectLogProduced(
        'Record fetched successfully',
        {},
        LogMethodNames.DEBUG,
        1
      );
    });

    test('When record item is undefined then an error should be thrown', async () => {
      const expectedResult = {};
      const expectedException = new DbRecordNotFoundError(
        'Empty response - record not found'
      );
      dbDocumentClient.get.resolves(expectedResult);

      await expect(
        service.getRecordById<IHealthCheck>(fetchParams)
      ).rejects.toThrow(expectedException);

      expectCorrectGetInvoked();
      testUtil.expectLogProduced(
        'Could not fetch record from table',
        {
          error: 'Empty response - record not found',
          tableName: `${process.env.ENV_NAME}-nhc-health-check-db`,
          keyValue: recordId,
          key: 'id'
        },
        LogMethodNames.ERROR
      );
    });

    test('When record cannot be fetched then the exception should be rethrown', async () => {
      const exception = new Error(
        'could not fetch record by partition key value'
      );
      dbDocumentClient.get.throwsException(exception);

      await expect(
        service.getRecordById<IHealthCheck>(fetchParams)
      ).rejects.toThrow(exception);

      expectCorrectGetInvoked();
      testUtil.expectLogProduced(
        'Could not fetch record from table',
        {
          error: exception,
          tableName: `${process.env.ENV_NAME}-nhc-health-check-db`,
          id: recordId
        },
        LogMethodNames.ERROR
      );
    });
  });

  describe('getOptionalRecordById tests', () => {
    const recordId = '12345';
    const fetchParams: EntityFetchParams = {
      table: DbTable.HealthChecks,
      partitionKeyName: 'id',
      partitionKeyValue: recordId,
      indexName: 'idIndex'
    };

    function expectCorrectGetInvoked(): void {
      const commandInput: GetCommandInput = {
        TableName: `${process.env.ENV_NAME}-nhc-health-check-db`,
        Key: { id: recordId }
      };

      expect(dbDocumentClient.get.calledOnce).toBeTruthy();
      expect(dbDocumentClient.get.getCall(0).args[0]).toMatchObject(
        commandInput
      );
    }

    test('When record is fetched successfully then a log should be produced', async () => {
      const expectedResult = {
        Item: { id: recordId }
      };
      dbDocumentClient.get.resolves(expectedResult);

      const result =
        await service.getOptionalRecordById<IHealthCheck>(fetchParams);

      expect(result).toMatchObject(expectedResult.Item);

      expectCorrectGetInvoked();
      testUtil.expectLogProduced(
        'Record fetched successfully',
        {},
        LogMethodNames.DEBUG,
        1
      );
    });

    test('When record item is undefined then it should be returned', async () => {
      const expectedResult = {};
      dbDocumentClient.get.resolves(expectedResult);

      const result =
        await service.getOptionalRecordById<IHealthCheck>(fetchParams);

      expect(result).toBeUndefined();

      expectCorrectGetInvoked();
      testUtil.expectLogProduced(
        'Record fetched successfully',
        {},
        LogMethodNames.DEBUG,
        1
      );
    });

    test('When record fetch produces an error then the exception should be rethrown', async () => {
      const exception = new Error(
        'could not fetch record by partition key value'
      );
      dbDocumentClient.get.throwsException(exception);

      await expect(
        service.getOptionalRecordById<IHealthCheck>(fetchParams)
      ).rejects.toThrow(exception);

      expectCorrectGetInvoked();
      testUtil.expectLogProduced(
        'Could not fetch record from table',
        {
          error: exception,
          tableName: `${process.env.ENV_NAME}-nhc-health-check-db`,
          id: recordId
        },
        LogMethodNames.ERROR
      );
    });
  });

  describe('getAllRecords tests', () => {
    function expectCorrectScanInvoked(): void {
      const commandInput: ScanCommandInput = {
        TableName: `${process.env.ENV_NAME}-nhc-ods-code-db`,
        FilterExpression: '#enabled = :scanFilter',
        ExpressionAttributeValues: { ':scanFilter': true },
        ExpressionAttributeNames: { '#enabled': 'enabled' }
      };

      expect(dbDocumentClient.scan.calledOnce).toBeTruthy();
      expect(dbDocumentClient.scan.getCall(0).args[0]).toMatchObject(
        commandInput
      );
    }

    test('When all records are fetched successfully then a log should be produced', async () => {
      const expectedResult = {
        Items: [{ code: 'code1', enabled: true }],
        Count: 1
      };
      dbDocumentClient.scan.resolves(expectedResult);

      const result = await service.getAllRecords<IGpOdsCode>({
        table: DbTable.GpOdsCodes
      });

      expect(result).toMatchObject(expectedResult.Items);
      const commandInput: ScanCommandInput = {
        TableName: `${process.env.ENV_NAME}-nhc-ods-code-db`
      };
      expect(dbDocumentClient.scan.calledOnce).toBeTruthy();
      expect(dbDocumentClient.scan.getCall(0).args[0]).toMatchObject(
        commandInput
      );
      testUtil.expectLogProduced(
        'All records fetched successfully',
        {
          recordsReturned: expectedResult.Count
        },
        LogMethodNames.DEBUG,
        2
      );
    });

    test('When all records are fetched with filter successfully then a log should be produced', async () => {
      const expectedResult = {
        Items: [{ code: 'code1', enabled: true }],
        Count: 1
      };
      dbDocumentClient.scan.resolves(expectedResult);

      const result = await service.getAllRecords<IGpOdsCode>({
        table: DbTable.GpOdsCodes,
        filterBy: { key: 'enabled', value: true }
      });

      expect(result).toMatchObject(expectedResult.Items);
      expectCorrectScanInvoked();
      testUtil.expectLogProduced(
        'All records fetched successfully',
        {
          recordsReturned: expectedResult.Count
        },
        LogMethodNames.DEBUG,
        2
      );
    });

    test('When there are multiple pages of results, all of them are fetched with correct ExclusiveStartKey', async () => {
      const expectedResult1 = {
        Items: [{ code: 'code1', enabled: true }],
        Count: 1,
        LastEvaluatedKey: 'code1'
      };
      const expectedResult2 = {
        Items: [
          { code: 'code2', enabled: false },
          { code: 'code3', enabled: false }
        ],
        Count: 2,
        LastEvaluatedKey: 'code3'
      };
      const expectedResult3 = {
        Items: [{ code: 'code4', enabled: true }],
        Count: 1
      };
      dbDocumentClient.scan.onFirstCall().resolves(expectedResult1);
      dbDocumentClient.scan.onSecondCall().resolves(expectedResult2);
      dbDocumentClient.scan.onThirdCall().resolves(expectedResult3);
      const result = await service.getAllRecords<IGpOdsCode>({
        table: DbTable.GpOdsCodes
      });

      expect(result).toMatchObject(
        expectedResult1.Items.concat(expectedResult2.Items).concat(
          expectedResult3.Items
        )
      );
      expect(dbDocumentClient.scan.calledThrice).toBeTruthy();
      expect(dbDocumentClient.scan.getCall(0).args[0]).toMatchObject({
        TableName: `${process.env.ENV_NAME}-nhc-ods-code-db`
      });
      expect(dbDocumentClient.scan.getCall(1).args[0]).toMatchObject({
        TableName: `${process.env.ENV_NAME}-nhc-ods-code-db`,
        ExclusiveStartKey: expectedResult1.LastEvaluatedKey
      });
      expect(dbDocumentClient.scan.getCall(2).args[0]).toMatchObject({
        TableName: `${process.env.ENV_NAME}-nhc-ods-code-db`,
        ExclusiveStartKey: expectedResult2.LastEvaluatedKey
      });
      testUtil.expectLogProduced(
        'All records fetched successfully',
        {
          recordsReturned: 4
        },
        LogMethodNames.DEBUG,
        4
      );
    });

    test('When all records cannot be fetched the exception should be rethrown', async () => {
      const exception = new Error('could not fetch all record from the table');
      dbDocumentClient.scan.throwsException(exception);

      await expect(
        service.getAllRecords<IGpOdsCode>({
          table: DbTable.GpOdsCodes,
          filterBy: { key: 'enabled', value: true }
        })
      ).rejects.toThrow(exception);

      expectCorrectScanInvoked();
      testUtil.expectLogProduced(
        'Could not get all records from table',
        {
          tableName: `${process.env.ENV_NAME}-nhc-ods-code-db`,
          error: exception
        },
        LogMethodNames.ERROR
      );
    });
  });

  describe('createRecord tests', () => {
    const testAuditEvent: IAuditEvent = {
      id: 'eb69f9f3-f994-4852-a924-1dd182e03cec',
      healthCheckId: '12345',
      nhcVersion: '1.0',
      odsCode: 'AA1234',
      nhsNumber: '123123123',
      eventType: AuditEventType.HealthCheckCreated
    };

    function expectCorrectPutInvoked(createParams: EntityCreateParams): void {
      const commandInput: PutCommandInput = {
        TableName: `${process.env.ENV_NAME}-nhc-audit-event-db`,
        Item: createParams.item,
        ConditionExpression: createParams.conditionExpression ?? undefined
      };

      expect(dbDocumentClient.put.calledOnce).toBeTruthy();
      expect(dbDocumentClient.put.getCall(0).args[0]).toMatchObject(
        commandInput
      );
    }
    test('When record is created successfully then a log should be produced', async () => {
      dbDocumentClient.put.resolves();

      const createParams: EntityCreateParams = {
        table: DbTable.AuditEvents,
        item: testAuditEvent
      };
      await service.createRecord(createParams);

      expectCorrectPutInvoked(createParams);
      testUtil.expectLogProduced(
        'record created successfully',
        {
          tableName: `${process.env.ENV_NAME}-nhc-audit-event-db`
        },
        LogMethodNames.DEBUG,
        1
      );
    });

    test('When condition expression is provided it should be passed to the put command', async () => {
      dbDocumentClient.put.resolves();

      const createParams: EntityCreateParams = {
        table: DbTable.AuditEvents,
        item: testAuditEvent,
        conditionExpression: 'attribute_not_exists(healthCheckId)'
      };
      await service.createRecord(createParams);

      expectCorrectPutInvoked(createParams);
      testUtil.expectLogProduced(
        'record created successfully',
        {
          tableName: `${process.env.ENV_NAME}-nhc-audit-event-db`
        },
        LogMethodNames.DEBUG,
        1
      );
    });

    test('When record creation fails then the exception should be rethrown', async () => {
      const exception = new Error('could not put record in the table');
      dbDocumentClient.put.throwsException(exception);

      const createParams: EntityCreateParams = {
        table: DbTable.AuditEvents,
        item: testAuditEvent
      };

      await expect(service.createRecord(createParams)).rejects.toThrow(
        exception
      );

      expectCorrectPutInvoked(createParams);
      testUtil.expectLogProduced(
        'could not create a new record',
        {
          tableName: `${process.env.ENV_NAME}-nhc-audit-event-db`,
          error: exception
        },
        LogMethodNames.ERROR
      );
    });
  });

  describe('updateRecordProperties tests', () => {
    test('When record is updated successfully then a log should be produced', async () => {
      const response: UpdateCommandOutput = {
        Attributes: {
          questionnaire: {}
        },
        ItemCollectionMetrics: {},
        $metadata: {}
      };
      dbDocumentClient.update.resolves(response);

      const updateParams: EntityUpdateParams = {
        table: DbTable.HealthChecks,
        partitionKeyValue: '12345',
        updates: {
          questionnaire: {
            weight: 90,
            sex: Sex.Male
          }
        },
        returnValues: 'ALL_NEW'
      };

      await service.updateRecordProperties(updateParams);

      const commandInput: UpdateCommandInput = {
        TableName: `${process.env.ENV_NAME}-nhc-health-check-db`,
        Key: {
          id: '12345'
        },
        ExpressionAttributeValues: {
          ':questionnaire': {
            weight: 90,
            sex: 'Male'
          }
        },
        ExpressionAttributeNames: { '#questionnaire': 'questionnaire' },
        UpdateExpression: 'SET #questionnaire = :questionnaire'
      };

      expect(dbDocumentClient.update.calledOnce).toBeTruthy();
      expect(dbDocumentClient.update.getCall(0).args[0]).toMatchObject(
        commandInput
      );

      testUtil.expectLogProduced(
        'record updated successfully',
        {
          id: updateParams.partitionKeyValue,
          tableName: `${process.env.ENV_NAME}-nhc-health-check-db`
        },
        LogMethodNames.DEBUG,
        1
      );
    });

    test('When sort key value is provided and table does not have sort key defined it should not be passed to update command input', async () => {
      const response: UpdateCommandOutput = {
        Attributes: {
          questionnaire: {}
        },
        ItemCollectionMetrics: {},
        $metadata: {}
      };
      dbDocumentClient.update.resolves(response);

      const updateParams: EntityUpdateParams = {
        table: DbTable.HealthChecks,
        partitionKeyValue: '12345',
        sortKeyValue: 'non-existing',
        updates: {
          test: 20
        },
        returnValues: 'ALL_NEW'
      };

      await service.updateRecordProperties(updateParams);

      const commandInput: UpdateCommandInput = {
        TableName: `${process.env.ENV_NAME}-nhc-health-check-db`,
        Key: {
          id: '12345'
        },
        ExpressionAttributeValues: {
          ':test': 20
        },
        ExpressionAttributeNames: { '#test': 'test' },
        UpdateExpression: 'SET #test = :test',
        ReturnValues: ReturnValue.ALL_NEW
      };

      expect(dbDocumentClient.update.calledOnce).toBeTruthy();
      expect(dbDocumentClient.update.getCall(0).args[0]).toMatchObject(
        commandInput
      );
    });

    test('When sort key value is provided and table has sort key defined it should be passed to update command input', async () => {
      const response: UpdateCommandOutput = {
        Attributes: {
          questionnaire: {}
        },
        ItemCollectionMetrics: {},
        $metadata: {}
      };
      dbDocumentClient.update.resolves(response);

      const labId = '112233';
      const updateParams: EntityUpdateParams = {
        table: DbTable.LabResults,
        partitionKeyValue: '12345',
        sortKeyValue: '12',
        updates: {
          labId
        },
        returnValues: ReturnValue.ALL_NEW
      };

      await service.updateRecordProperties(updateParams);

      const commandInput: UpdateCommandInput = {
        TableName: `${process.env.ENV_NAME}-nhc-lab-result-db`,
        Key: {
          orderId: '12345',
          testType: '12'
        },
        ExpressionAttributeValues: {
          ':labId': labId
        },
        ExpressionAttributeNames: { '#labId': 'labId' },
        UpdateExpression: 'SET #labId = :labId',
        ReturnValues: ReturnValue.ALL_NEW
      };

      expect(dbDocumentClient.update.calledOnce).toBeTruthy();
      expect(dbDocumentClient.update.getCall(0).args[0]).toMatchObject(
        commandInput
      );
    });

    test('When properties are marked for removal they get removed', async () => {
      const response: UpdateCommandOutput = {
        Attributes: {
          questionnaire: {}
        },
        ItemCollectionMetrics: {},
        $metadata: {}
      };
      dbDocumentClient.update.resolves(response);

      const updateParams: EntityUpdateParams = {
        table: DbTable.HealthChecks,
        partitionKeyValue: '12345',
        updates: {
          questionnaire: {
            weight: 90,
            sex: Sex.Male
          }
        },
        removals: ['propA', 'propB'],
        returnValues: 'ALL_NEW'
      };

      await service.updateRecordProperties(updateParams);

      const commandInput: UpdateCommandInput = {
        TableName: `${process.env.ENV_NAME}-nhc-health-check-db`,
        Key: {
          id: '12345'
        },
        ExpressionAttributeValues: {
          ':questionnaire': {
            weight: 90,
            sex: 'Male'
          }
        },
        ExpressionAttributeNames: { '#questionnaire': 'questionnaire' },
        UpdateExpression:
          'SET #questionnaire = :questionnaire REMOVE propA, propB'
      };

      expect(dbDocumentClient.update.calledOnce).toBeTruthy();
      expect(dbDocumentClient.update.getCall(0).args[0]).toMatchObject(
        commandInput
      );

      testUtil.expectLogProduced(
        'record updated successfully',
        {
          id: updateParams.partitionKeyValue,
          tableName: `${process.env.ENV_NAME}-nhc-health-check-db`
        },
        LogMethodNames.DEBUG,
        1
      );
    });
  });

  describe('deleteRecord tests', () => {
    test('When proper params are set, the record is deleted', async () => {
      dbDocumentClient.delete.resolves();

      const deleteParams: EntityDeleteParams = {
        table: DbTable.HealthChecks,
        partitionKeyValue: '12345'
      };

      await service.deleteRecord(deleteParams);

      const commandInput: DeleteCommandInput = {
        TableName: `${process.env.ENV_NAME}-nhc-health-check-db`,
        Key: {
          id: '12345'
        }
      };

      expect(dbDocumentClient.delete.calledOnce).toBeTruthy();
      expect(dbDocumentClient.delete.getCall(0).args[0]).toMatchObject(
        commandInput
      );
    });

    test('When proper params with sort key are set, the record is deleted', async () => {
      dbDocumentClient.delete.resolves();

      const deleteParams: EntityDeleteParams = {
        table: DbTable.LabResults,
        partitionKeyValue: '12345',
        sortKeyValue: '123'
      };

      await service.deleteRecord(deleteParams);

      const commandInput: DeleteCommandInput = {
        TableName: `${process.env.ENV_NAME}-nhc-lab-result-db`,
        Key: {
          orderId: '12345',
          testType: '123'
        }
      };

      expect(dbDocumentClient.delete.calledOnce).toBeTruthy();
      expect(dbDocumentClient.delete.getCall(0).args[0]).toMatchObject(
        commandInput
      );
    });

    test('When params are set with sort key, but table has no sort key, an error is thrown', async () => {
      dbDocumentClient.delete.resolves();

      const deleteParams: EntityDeleteParams = {
        table: DbTable.HealthChecks,
        partitionKeyValue: '12345',
        sortKeyValue: '123'
      };

      await expect(service.deleteRecord(deleteParams)).rejects.toThrow(
        `Table ${deleteParams.table} does not have a sortKey defined`
      );

      expect(dbDocumentClient.delete.notCalled).toBeTruthy();
    });
  });

  describe('batchUpdate tests', () => {
    const tableName: string = `${process.env.ENV_NAME}-nhc-ods-codes-db`;
    const batchInput: IBatchInput = {
      inserts: [
        {
          gpOdsCode: 'test1',
          enabled: true
        },
        {
          gpOdsCode: 'test2',
          enabled: false
        }
      ]
    };

    test('When records are inserted as a batch successfully then a log should be produced', async () => {
      dbDocumentClient.batchWrite.resolves();

      await service.batchUpdate(tableName, batchInput);

      const expectedCommandInput: BatchWriteCommandInput = {
        RequestItems: {
          [tableName]: [
            {
              PutRequest: {
                Item: {
                  gpOdsCode: 'test1',
                  enabled: true
                }
              }
            },
            {
              PutRequest: {
                Item: {
                  gpOdsCode: 'test2',
                  enabled: false
                }
              }
            }
          ]
        }
      };

      expect(dbDocumentClient.batchWrite.calledOnce).toBeTruthy();
      expect(dbDocumentClient.batchWrite.getCall(0).args[0]).toMatchObject(
        expectedCommandInput
      );

      testUtil.expectLogProduced(
        'batch update completed successfully',
        {
          tableName,
          chunkSize: 2
        },
        LogMethodNames.DEBUG,
        1
      );
    });

    test('When an exception occurs during batch write operation it should be thrown', async () => {
      const exception = new Error('could not execute batch operation');
      dbDocumentClient.batchWrite.throwsException(exception);

      await expect(service.batchUpdate(tableName, batchInput)).rejects.toThrow(
        exception
      );

      testUtil.expectLogProduced(
        'could not complete batch update',
        {
          tableName,
          error: exception
        },
        LogMethodNames.ERROR
      );
    });

    test('When empty input is provided to batch operation it should not be executed and log should be produced', async () => {
      dbDocumentClient.batchWrite.resolves();

      await service.batchUpdate(tableName, { inserts: [] });

      expect(dbDocumentClient.batchWrite.notCalled).toBeTruthy();
      testUtil.expectLogProduced(
        'no data provided to batch update operation',
        {
          tableName
        },
        LogMethodNames.INFO
      );
    });

    test('When max limit of updates is exceeded, the updates are made in multiple separate requests', async () => {
      dbDocumentClient.batchWrite.resolves();

      await service.batchUpdate(tableName, {
        inserts: Array.from(Array(51).keys()).map((id) => {
          return {
            gpOdsCode: `test${id}`,
            enabled: true
          };
        })
      });

      expect(dbDocumentClient.batchWrite.calledThrice).toBeTruthy();
      expect(
        dbDocumentClient.batchWrite.getCall(0).args[0].RequestItems?.[tableName]
          ?.length
      ).toEqual(25);
      expect(
        dbDocumentClient.batchWrite.getCall(1).args[0].RequestItems?.[tableName]
          ?.length
      ).toEqual(25);
      expect(
        dbDocumentClient.batchWrite.getCall(2).args[0].RequestItems?.[tableName]
          ?.length
      ).toEqual(1);
    });
  });

  describe('parallelBatchUpdate tests', () => {
    const tableName = `${process.env.ENV_NAME}-nhc-ods-code-db`;
    const partitionKeyName = 'gpOdsCode';

    beforeEach(() => {
      sandbox
        .stub(service as any, 'getPartitionKeyNameByTableName')
        .returns(partitionKeyName);
    });

    test('When no items provided, returns result with no operations', async () => {
      const batchInput = { inserts: [] };
      dbDocumentClient.batchWrite.resolves({}); // should not be called

      const result = await service.parallelBatchUpdate(tableName, batchInput);
      expect(result.totalItems).toEqual(0);
      expect(result.successfulItems.length).toEqual(0); // Check items array
      expect(result.errors.length).toEqual(0);
      expect(dbDocumentClient.batchWrite.notCalled).toBeTruthy();
    });

    test('Processes multiple chunks concurrently and returns successful items', async () => {
      // Create 51 items => 3 chunks (25, 25, 1)
      const inserts = Array.from({ length: 51 }, (_, id) => ({
        [partitionKeyName]: `${id}`,
        data: `item${id}`
      }));
      const batchInput = { inserts };

      dbDocumentClient.batchWrite.resolves({ UnprocessedItems: {} });

      const result = await service.parallelBatchUpdate(tableName, batchInput);

      expect(result.totalItems).toEqual(51);
      expect(result.successfulItems.length).toEqual(51);
      expect(result.errors.length).toEqual(0);
      expect(result.successfulItems).toEqual(inserts);
      // Expect three batchWrite calls (one per chunk)
      expect(dbDocumentClient.batchWrite.callCount).toEqual(3);
    });

    test('Retries unprocessed items and completes successfully, returning all items as successful', async () => {
      const item1 = { [partitionKeyName]: '1', data: 'item1' };
      const item2 = { [partitionKeyName]: '2', data: 'item2' };
      const item3 = { [partitionKeyName]: '3', data: 'item3' };
      const batchInput = { inserts: [item1, item2, item3] };

      // First call returns one unprocessed item; second call processes it.
      const unprocessedResponse = {
        UnprocessedItems: {
          [tableName]: [{ PutRequest: { Item: item1 } }] // Item 1 is unprocessed
        }
      };
      const successResponse = { UnprocessedItems: {} }; // Second call is successful

      dbDocumentClient.batchWrite.onCall(0).resolves(unprocessedResponse);
      dbDocumentClient.batchWrite.onCall(1).resolves(successResponse);

      const result = await service.parallelBatchUpdate(
        tableName,
        batchInput,
        1 // Max concurrency 1 to process sequentially for predictability
      );
      expect(result.totalItems).toEqual(3);
      expect(result.successfulItems.length).toEqual(3); // All items eventually succeeded
      expect(result.errors.length).toEqual(0);
      // Check that all original items are in the successful list
      expect(result.successfulItems).toEqual(
        expect.arrayContaining([item1, item2, item3])
      );
      expect(dbDocumentClient.batchWrite.callCount).toEqual(2); // Initial call + 1 retry call
      const firstWrite = dbDocumentClient.batchWrite.getCall(0).args[0];
      const secondWrite = dbDocumentClient.batchWrite.getCall(1).args[0];
      expect((firstWrite.RequestItems as any)[tableName]).toEqual([
        { PutRequest: { Item: item1 } },
        { PutRequest: { Item: item2 } },
        { PutRequest: { Item: item3 } }
      ]);
      expect((secondWrite.RequestItems as any)[tableName]).toEqual([
        { PutRequest: { Item: item1 } }
      ]);
    });

    test('Exceeds max retries and reports failed items with errors', async () => {
      const item1 = { [partitionKeyName]: '1', data: 'item1' };
      const item2 = { [partitionKeyName]: '2', data: 'item2' };
      const batchInput = { inserts: [item1, item2] };

      // Force batchWrite to always return both items as unprocessed.
      const alwaysUnprocessedResponse = {
        UnprocessedItems: {
          [tableName]: [
            { PutRequest: { Item: item1 } },
            { PutRequest: { Item: item2 } }
          ]
        }
      };
      dbDocumentClient.batchWrite.resolves(alwaysUnprocessedResponse); // Simulate persistent failure

      const result = await service.parallelBatchUpdate(
        tableName,
        batchInput,
        1 // Max concurrency 1
      );

      expect(result.totalItems).toEqual(2);
      expect(result.successfulItems.length).toEqual(0);
      expect(result.errors.length).toEqual(2); // One error per failed item
      expect(result.errors[0].item).toEqual(item1);
      expect(result.errors[0].error).toContain('failed after 3 attempts');
      expect(result.errors[1].item).toEqual(item2);
      expect(result.errors[1].error).toContain('failed after 3 attempts');
      expect(dbDocumentClient.batchWrite.callCount).toEqual(3);
    });

    test('Handles batchWrite throwing an error during retries', async () => {
      const item1 = { [partitionKeyName]: '1', data: 'item1' };
      const item2 = { [partitionKeyName]: '2', data: 'item2' };
      const batchInput = { inserts: [item1, item2] };
      const failureError = new Error('batch failure');

      // First call succeeds for item2, but item1 is unprocessed
      const firstResponse = {
        UnprocessedItems: {
          [tableName]: [{ PutRequest: { Item: item1 } }]
        }
      };
      // Second call (retry for item1) throws an error
      dbDocumentClient.batchWrite.onCall(0).resolves(firstResponse);
      // Subsequent retries will throw an error
      dbDocumentClient.batchWrite.onCall(1).rejects(failureError);
      dbDocumentClient.batchWrite.onCall(2).rejects(failureError);

      const result = await service.parallelBatchUpdate(
        tableName,
        batchInput,
        1
      );

      expect(result.totalItems).toEqual(2);
      expect(result.successfulItems.length).toEqual(1); // item2 succeeded initially
      expect(result.successfulItems[0]).toEqual(item2);
      expect(result.errors.length).toEqual(1); // One error for the failed item1
      expect(result.errors[0].item).toEqual(item1);
      expect(result.errors[0].error).toEqual(failureError.message); // Error message from the exception
      expect(dbDocumentClient.batchWrite.callCount).toEqual(3);
    });

    test('Handles critical error during processing', async () => {
      const item1 = { [partitionKeyName]: '1', data: 'item1' };
      const item2 = { [partitionKeyName]: '2', data: 'item2' };
      const batchInput = { inserts: [item1, item2] };
      const criticalError = new Error('Critical failure');

      dbDocumentClient.batchWrite.rejects(criticalError);

      const result = await service.parallelBatchUpdate(tableName, batchInput);

      expect(result.totalItems).toEqual(2);
      expect(result.successfulItems.length).toEqual(0); // No items could be confirmed successful
      expect(result.errors.length).toEqual(2); // Error associated with each item
      expect(result.errors[0].item).toEqual(item1);
      expect(result.errors[0].error).toEqual(criticalError.message);
      expect(result.errors[1].item).toEqual(item2);
      expect(result.errors[1].error).toEqual(criticalError.message);
    });
  });
});
