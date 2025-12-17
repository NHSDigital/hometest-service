import { Commons } from '../../../../src/lib/commons';
import { DbClient } from '../../../../src/lib/db/db-client';
import Sinon from 'ts-sinon';
import { DbTable } from '../../../../src/lib/db/db-tables';
import { CommunicationLogDbClient } from '../../../../src/lib/db/db-clients/communication-log-db-client';
import { type ICommunicationLog } from '../../../../src/lib/models/notify-callbacks/communication-log';
import { messageTypeMap } from '../../../../src/lib/communications/communications-queue-client-service';
import { NotificationTemplate } from '@dnhc-health-checks/shared';

describe('CommunicationLogDbClient tests', () => {
  const sandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let dbClientStub: Sinon.SinonStubbedInstance<DbClient>;
  let communicationLogDbClient: CommunicationLogDbClient;

  const communicationLog: ICommunicationLog = {
    healthCheckId: '12345',
    type: messageTypeMap[NotificationTemplate.ALL_RESULTS].notificationType,
    createdAt: '2023-10-01T00:00:00Z',
    receivedAt: '2023-10-02T00:00:00Z',
    messageId: 'abc',
    messageReference: 'def',
    messageStatus: 'ghi',
    messageStatusDescription: 'jkl',
    channels: [],
    ttl: 1000
  };

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    dbClientStub = sandbox.createStubInstance(DbClient);
    communicationLogDbClient = new CommunicationLogDbClient(
      commonsStub as unknown as Commons,
      dbClientStub as unknown as DbClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  test('should insert a valid communication log', async () => {
    await communicationLogDbClient.insertCommunicationLog(communicationLog);
    expect(
      dbClientStub.createRecord.calledOnceWithExactly({
        table: DbTable.CommunicationLog,
        item: communicationLog
      })
    ).toBeTruthy();
  });

  test('should update a valid communication log', async () => {
    const messageReference = communicationLog.messageReference;
    const updates: Partial<ICommunicationLog> = {
      messageStatus: 'UpdatedStatus',
      messageStatusDescription: 'UpdatedDescription'
    };

    await communicationLogDbClient.updateCommunicationLog(
      messageReference,
      updates
    );
    expect(
      dbClientStub.updateRecordProperties.calledOnceWithExactly({
        table: DbTable.CommunicationLog,
        partitionKeyValue: messageReference,
        updates,
        returnValues: 'ALL_NEW'
      })
    ).toBeTruthy();
  });

  test('should throw a error when insert communication log failed', async () => {
    const exception = new Error('communication log could not be saved');
    dbClientStub.createRecord.throwsException(exception);

    await expect(
      communicationLogDbClient.insertCommunicationLog(communicationLog)
    ).rejects.toThrow(exception);
    expect(
      dbClientStub.createRecord.calledOnceWithExactly({
        table: DbTable.CommunicationLog,
        item: communicationLog
      })
    ).toBeTruthy();
  });

  test('should return a communication log when found by message reference', async () => {
    const messageReference = communicationLog.messageReference;
    dbClientStub.getOptionalRecordById.resolves(communicationLog);

    const result =
      await communicationLogDbClient.getCommunicationLogByMessageReference(
        messageReference
      );

    expect(
      dbClientStub.getOptionalRecordById.calledOnceWithExactly({
        table: DbTable.CommunicationLog,
        partitionKeyValue: messageReference
      })
    ).toBeTruthy();
    expect(result).toEqual(communicationLog);
  });
});
