import { Commons } from '../../../../src/lib/commons';
import { DbClient } from '../../../../src/lib/db/db-client';
import { DeadLetterMessageDbClient } from '../../../../src/lib/db/db-clients/dead-letter-message-db-client';
import { DbTable } from '../../../../src/lib/db/db-tables';
import {
  DeadLetterMessageStatus,
  type IDeadLetterMessage
} from '../../../../src/lib/models/dead-letter-messages/dead-letter-message';
import Sinon from 'ts-sinon';
import dayjs from 'dayjs';

const mockDate = '2024-04-23T11:23:12.123Z';
jest.useFakeTimers().setSystemTime(Date.parse(mockDate));

describe('DeadLetterMessageDbClient tests', () => {
  const sandbox = Sinon.createSandbox();
  let commonsStub: Sinon.SinonStubbedInstance<Commons>;
  let dbClientStub: Sinon.SinonStubbedInstance<DbClient>;
  let dbClient: DeadLetterMessageDbClient;
  const serviceClassName = 'DeadLetterMessageDbClient';

  const deadLetterMessage: IDeadLetterMessage = {
    id: '1234',
    queueName: 'queue',
    messageId: 'abcd1234',
    messageCreationTime: '2024-12-04T09:05:24.307Z',
    addToDbTime: '2024-12-04T09:05:24.307Z',
    messageBody: '{}',
    status: DeadLetterMessageStatus.New,
    retries: 0,
    originalMessageId: 'abcd1234',
    maxAutoRetriesReached: false
  };

  beforeEach(() => {
    commonsStub = sandbox.createStubInstance(Commons);
    dbClientStub = sandbox.createStubInstance(DbClient);
    dbClient = new DeadLetterMessageDbClient(
      commonsStub as unknown as Commons,
      dbClientStub as unknown as DbClient
    );
  });

  afterEach(() => {
    sandbox.reset();
  });

  describe('insertDeadLetterMessage method tests', () => {
    test('should insert message successfully', async () => {
      await dbClient.insertDeadLetterMessage(deadLetterMessage);

      expect(
        dbClientStub.createRecord.calledOnceWithExactly({
          table: DbTable.DeadLetterMessages,
          item: deadLetterMessage
        })
      ).toBeTruthy();
      sandbox.assert.calledWithExactly(
        commonsStub.logInfo,
        serviceClassName,
        'Dead letter message created successfully',
        { deadLetterMessageId: deadLetterMessage.id }
      );
    });

    test('should throw error for failed creation', async () => {
      const exception = new Error('could not create a new message');
      dbClientStub.createRecord.throwsException(exception);

      await expect(
        dbClient.insertDeadLetterMessage(deadLetterMessage)
      ).rejects.toThrow(exception);

      expect(
        dbClientStub.createRecord.calledOnceWithExactly({
          table: DbTable.DeadLetterMessages,
          item: deadLetterMessage
        })
      ).toBeTruthy();
      sandbox.assert.calledWithExactly(
        commonsStub.logError,
        serviceClassName,
        'Could not create a new dead letter message',
        { deadLetterMessageId: deadLetterMessage.id, error: exception },
        undefined
      );
    });
  });

  describe('getNewDeadLetterMessage method tests', () => {
    test('should fetch a new dead letter message successfully', async () => {
      dbClientStub.getOptionalRecordById.resolves(deadLetterMessage);

      const result = await dbClient.getNewDeadLetterMessage(
        deadLetterMessage.id
      );

      expect(result).toEqual(deadLetterMessage);
      Sinon.assert.calledOnceWithExactly(dbClientStub.getOptionalRecordById, {
        table: DbTable.DeadLetterMessages,
        partitionKeyName: 'id',
        partitionKeyValue: deadLetterMessage.id
      });
    });

    test('should return undefined if message does not exist', async () => {
      dbClientStub.getOptionalRecordById.resolves(undefined);

      const result = await dbClient.getNewDeadLetterMessage('nonexistent-id');

      expect(result).toBeUndefined();
      Sinon.assert.calledOnceWithExactly(dbClientStub.getOptionalRecordById, {
        table: DbTable.DeadLetterMessages,
        partitionKeyName: 'id',
        partitionKeyValue: 'nonexistent-id'
      });
    });

    test('should return undefined if message is already redriven', async () => {
      const redrivenMessage = {
        ...deadLetterMessage,
        status: DeadLetterMessageStatus.Redriven
      };
      dbClientStub.getOptionalRecordById.resolves(redrivenMessage);

      const result = await dbClient.getNewDeadLetterMessage(
        deadLetterMessage.id
      );

      expect(result).toBeUndefined();
      Sinon.assert.calledOnceWithExactly(dbClientStub.getOptionalRecordById, {
        table: DbTable.DeadLetterMessages,
        partitionKeyName: 'id',
        partitionKeyValue: deadLetterMessage.id
      });
    });
  });

  describe('getNewDeadLetterMessagesForQueue method tests', () => {
    test('should fetch new messages for a queue successfully', async () => {
      const queueMessages = [
        deadLetterMessage,
        { ...deadLetterMessage, id: '5678', messageId: 'xyz5678' }
      ];
      dbClientStub.getRecordsByPartitionKey.resolves(queueMessages);

      const result = await dbClient.getNewDeadLetterMessagesForQueue('queue');

      expect(result).toEqual(queueMessages);
      Sinon.assert.calledOnceWithExactly(
        dbClientStub.getRecordsByPartitionKey,
        {
          table: DbTable.DeadLetterMessages,
          partitionKeyName: 'queueName',
          partitionKeyValue: 'queue',
          indexName: 'queueNameIndex'
        }
      );
    });

    test('should return an empty array if no messages exist for the queue', async () => {
      dbClientStub.getRecordsByPartitionKey.resolves([]);

      const result =
        await dbClient.getNewDeadLetterMessagesForQueue('empty-queue');

      expect(result).toEqual([]);
      Sinon.assert.calledOnceWithExactly(
        dbClientStub.getRecordsByPartitionKey,
        {
          table: DbTable.DeadLetterMessages,
          partitionKeyName: 'queueName',
          partitionKeyValue: 'empty-queue',
          indexName: 'queueNameIndex'
        }
      );
    });
  });

  describe('getAllNewDeadLetterMessages method tests', () => {
    test('should fetch all new dead letter messages successfully', async () => {
      const allMessages = [
        deadLetterMessage,
        { ...deadLetterMessage, id: '5678', messageId: 'xyz5678' }
      ];
      dbClientStub.getAllRecords.resolves(allMessages);

      const result = await dbClient.getAllNewDeadLetterMessages();

      expect(result).toEqual(allMessages);
      Sinon.assert.calledOnceWithExactly(dbClientStub.getAllRecords, {
        table: DbTable.DeadLetterMessages,
        filterBy: {
          key: 'status',
          value: DeadLetterMessageStatus.New
        }
      });
    });

    test('should return an empty array if no new messages exist', async () => {
      dbClientStub.getAllRecords.resolves([]);

      const result = await dbClient.getAllNewDeadLetterMessages();

      expect(result).toEqual([]);
      Sinon.assert.calledOnceWithExactly(dbClientStub.getAllRecords, {
        table: DbTable.DeadLetterMessages,
        filterBy: {
          key: 'status',
          value: DeadLetterMessageStatus.New
        }
      });
    });
  });

  describe('markMessageAsRedriven method tests', () => {
    test('should mark a message as redriven successfully', async () => {
      dbClientStub.updateRecordProperties.resolves();

      await dbClient.markMessageAsRedriven(deadLetterMessage);

      Sinon.assert.calledOnceWithExactly(dbClientStub.updateRecordProperties, {
        table: DbTable.DeadLetterMessages,
        partitionKeyValue: deadLetterMessage.id,
        updates: {
          status: DeadLetterMessageStatus.Redriven,
          deleteTime: dayjs(mockDate).add(14, 'day').unix()
        }
      });
    });

    test('should throw an error if update fails', async () => {
      const error = new Error('Update failed');
      dbClientStub.updateRecordProperties.rejects(error);

      await expect(
        dbClient.markMessageAsRedriven(deadLetterMessage)
      ).rejects.toThrow('Update failed');

      Sinon.assert.calledOnceWithExactly(dbClientStub.updateRecordProperties, {
        table: DbTable.DeadLetterMessages,
        partitionKeyValue: deadLetterMessage.id,
        updates: {
          status: DeadLetterMessageStatus.Redriven,
          deleteTime: dayjs(mockDate).add(14, 'day').unix()
        }
      });
    });
  });

  describe('markMessageAsMaxRetriesReached method tests', () => {
    test('should set maxAutoRetriesReached to true successfully', async () => {
      dbClientStub.updateRecordProperties.resolves();

      await dbClient.markMessageAsMaxRetriesReached(deadLetterMessage);

      Sinon.assert.calledOnceWithExactly(dbClientStub.updateRecordProperties, {
        table: DbTable.DeadLetterMessages,
        partitionKeyValue: deadLetterMessage.id,
        updates: {
          maxAutoRetriesReached: true
        }
      });
    });

    test('should throw an error if update fails', async () => {
      const error = new Error('Update failed');
      dbClientStub.updateRecordProperties.rejects(error);

      await expect(
        dbClient.markMessageAsMaxRetriesReached(deadLetterMessage)
      ).rejects.toThrow('Update failed');

      Sinon.assert.calledOnceWithExactly(dbClientStub.updateRecordProperties, {
        table: DbTable.DeadLetterMessages,
        partitionKeyValue: deadLetterMessage.id,
        updates: {
          maxAutoRetriesReached: true
        }
      });
    });
  });
});
