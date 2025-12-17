import Sinon from 'ts-sinon';
import { Commons } from '../../../../src/lib/commons';
import { DbClient } from '../../../../src/lib/db/db-client';
import { MnsMessagesLogDbClient } from '../../../../src/lib/db/db-clients/mns-messages-log-db-client';
import { DbTable } from '../../../../src/lib/db/db-tables';
import {
  type IMnsMessageLog,
  MnsMessageStatus,
  MnsAcknowledgeType
} from '@dnhc-health-checks/shared';

describe('MnsMessagesLogDbClient', () => {
  const sandbox = Sinon.createSandbox();

  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let dbClientStub: Sinon.SinonStubbedInstance<DbClient>;
  let service: MnsMessagesLogDbClient;

  const testId = 'test-message-id-123';
  const testMnsId = 'mns-id-456';
  const testNhsNumber = '9999999999';
  const testGpOdsCode = 'A12345';
  const testPatientId = 'patient-id-789';
  const testHealthCheckId = 'health-check-id-101';
  const testSendTime = '2024-11-24T10:00:00Z';
  const testResourceId = 'resource-id-202';

  const testMnsMessageLog: IMnsMessageLog = {
    id: testId,
    mnsId: testMnsId,
    nhsNumber: testNhsNumber,
    gpOdsCode: testGpOdsCode,
    patientId: testPatientId,
    healthCheckId: testHealthCheckId,
    sendTime: testSendTime,
    status: MnsMessageStatus.SENT,
    resourceId: testResourceId
  };

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    dbClientStub = sandbox.createStubInstance(DbClient);

    service = new MnsMessagesLogDbClient(
      commonsStub as unknown as Commons,
      dbClientStub as unknown as DbClient
    );
  });

  afterEach(() => {
    sandbox.reset();
    jest.clearAllMocks();
  });

  describe('insertMnsMessageLog', () => {
    it('Should insert MNS message log successfully', async () => {
      await service.insertMnsMessageLog(testMnsMessageLog);

      sandbox.assert.calledOnceWithExactly(dbClientStub.createRecord, {
        table: DbTable.MnsMessagesLog,
        item: testMnsMessageLog
      });
    });

    it('When db client fails, should throw error', async () => {
      const error = new Error('Database insertion failed');
      dbClientStub.createRecord.throwsException(error);

      await expect(
        service.insertMnsMessageLog(testMnsMessageLog)
      ).rejects.toThrow(error);

      sandbox.assert.calledOnceWithExactly(dbClientStub.createRecord, {
        table: DbTable.MnsMessagesLog,
        item: testMnsMessageLog
      });
    });
  });

  describe('updateMnsMessageLog', () => {
    const updateData: Partial<IMnsMessageLog> = {
      status: MnsMessageStatus.BUSINESS_ACK_RECEIVED,
      ack: [
        {
          time: '2024-11-24T10:10:00Z',
          receiveTime: '2024-11-24T10:10:01Z',
          resourceId: 'updated-ack-resource-id',
          ackType: MnsAcknowledgeType.BUSINESS_ACK
        }
      ]
    };

    const expectedUpdatedRecord: IMnsMessageLog = {
      ...testMnsMessageLog,
      ...updateData
    };

    it('Should update MNS message log successfully', async () => {
      dbClientStub.updateRecordProperties.resolves(expectedUpdatedRecord);

      const result = await service.updateMnsMessageLog(testId, updateData);

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.updateRecordProperties,
        {
          table: DbTable.MnsMessagesLog,
          partitionKeyValue: testId,
          updates: updateData,
          returnValues: 'ALL_NEW'
        }
      );
      expect(result).toEqual(expectedUpdatedRecord);
    });

    it('When db client fails, should throw error', async () => {
      const error = new Error('Database update failed');
      dbClientStub.updateRecordProperties.throwsException(error);

      await expect(
        service.updateMnsMessageLog(testId, updateData)
      ).rejects.toThrow(error);

      sandbox.assert.calledOnceWithExactly(
        dbClientStub.updateRecordProperties,
        {
          table: DbTable.MnsMessagesLog,
          partitionKeyValue: testId,
          updates: updateData,
          returnValues: 'ALL_NEW'
        }
      );
    });
  });

  describe('getMnsMessageLogById', () => {
    it('Should retrieve MNS message log by ID successfully', async () => {
      dbClientStub.getOptionalRecordById.resolves(testMnsMessageLog);

      const result = await service.getMnsMessageLogById(testId);

      sandbox.assert.calledOnceWithExactly(dbClientStub.getOptionalRecordById, {
        table: DbTable.MnsMessagesLog,
        partitionKeyValue: testId
      });
      expect(result).toEqual(testMnsMessageLog);
    });

    it('Should return undefined when MNS message log not found', async () => {
      dbClientStub.getOptionalRecordById.resolves(undefined);

      const result = await service.getMnsMessageLogById('non-existent-id');

      sandbox.assert.calledOnceWithExactly(dbClientStub.getOptionalRecordById, {
        table: DbTable.MnsMessagesLog,
        partitionKeyValue: 'non-existent-id'
      });
      expect(result).toBeUndefined();
    });

    it('When db client fails, should throw error', async () => {
      const error = new Error('Database retrieval failed');
      dbClientStub.getOptionalRecordById.throwsException(error);

      await expect(service.getMnsMessageLogById(testId)).rejects.toThrow(error);

      sandbox.assert.calledOnceWithExactly(dbClientStub.getOptionalRecordById, {
        table: DbTable.MnsMessagesLog,
        partitionKeyValue: testId
      });
    });
  });
});
