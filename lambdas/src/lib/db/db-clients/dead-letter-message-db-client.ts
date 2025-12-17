import { type DbClient } from '../db-client';
import { Service } from '../../service';
import { type Commons } from '../../commons';
import {
  DeadLetterMessageStatus,
  type IDeadLetterMessage
} from '../../models/dead-letter-messages/dead-letter-message';
import {
  type EntityFetchParams,
  type EntityCreateParams,
  type EntityUpdateParams
} from '../entity-update-params';
import { DbTable } from '../db-tables';
import dayjs from 'dayjs';

export class DeadLetterMessageDbClient extends Service {
  readonly dbClient: DbClient;
  constructor(commons: Commons, dbClient: DbClient) {
    super(commons, 'DeadLetterMessageDbClient');
    this.dbClient = dbClient;
  }

  public async insertDeadLetterMessage(
    deadLetterMessage: IDeadLetterMessage
  ): Promise<void> {
    try {
      this.logger.debug('About to create a new dead letter message', {
        deadLetterMessageId: deadLetterMessage.id
      });
      const createParams: EntityCreateParams = {
        table: DbTable.DeadLetterMessages,
        item: deadLetterMessage
      };
      await this.dbClient.createRecord(createParams);
      this.logger.info('Dead letter message created successfully', {
        deadLetterMessageId: deadLetterMessage.id
      });
    } catch (error) {
      this.logger.error('Could not create a new dead letter message', {
        error,
        deadLetterMessageId: deadLetterMessage.id
      });
      throw error;
    }
  }

  public async getNewDeadLetterMessage(
    dynamoRecordId: string
  ): Promise<IDeadLetterMessage | undefined> {
    try {
      const fetchParams: EntityFetchParams = {
        table: DbTable.DeadLetterMessages,
        partitionKeyName: 'id',
        partitionKeyValue: dynamoRecordId
      };

      const record =
        await this.dbClient.getOptionalRecordById<IDeadLetterMessage>(
          fetchParams
        );

      if (record === undefined) {
        this.logger.error('Dead letter message not found.', { dynamoRecordId });
        return undefined;
      }

      if (record.status === DeadLetterMessageStatus.Redriven) {
        this.logger.error('Dead letter message already redriven.', {
          dynamoRecordId
        });
        return undefined;
      }

      this.logger.debug('Dead letter message fetched successfully', {
        dynamoRecordId
      });
      return record;
    } catch (error) {
      this.logger.error('Error fetching dead letter message by ID', {
        error,
        dynamoRecordId
      });
      throw error;
    }
  }

  public async getNewDeadLetterMessagesForQueue(
    queueName: string
  ): Promise<IDeadLetterMessage[]> {
    try {
      const fetchParams: EntityFetchParams = {
        table: DbTable.DeadLetterMessages,
        partitionKeyName: 'queueName',
        partitionKeyValue: queueName,
        indexName: 'queueNameIndex'
      };

      const results =
        await this.dbClient.getRecordsByPartitionKey<IDeadLetterMessage>(
          fetchParams
        );

      const filteredResults = results.filter(
        (message) => message.status === DeadLetterMessageStatus.New
      );

      return filteredResults;
    } catch (error) {
      this.logger.error('Error fetching dead letter messages by queue name.', {
        error,
        queueName
      });
      throw error;
    }
  }

  public async getAllNewDeadLetterMessages(): Promise<IDeadLetterMessage[]> {
    try {
      const fetchParams = {
        table: DbTable.DeadLetterMessages,
        filterBy: {
          key: 'status',
          value: DeadLetterMessageStatus.New
        }
      };

      const results =
        await this.dbClient.getAllRecords<IDeadLetterMessage>(fetchParams);

      return results;
    } catch (error) {
      this.logger.error('Error fetching all dead letter messages.', {
        error
      });
      throw error;
    }
  }

  public async markMessageAsRedriven(
    message: IDeadLetterMessage
  ): Promise<void> {
    const updateParams: EntityUpdateParams = {
      table: DbTable.DeadLetterMessages, // Enum value representing the table
      partitionKeyValue: message.id,
      updates: {
        status: DeadLetterMessageStatus.Redriven, // status to update
        deleteTime: dayjs().add(14, 'day').unix() // setting deleteTime to 14 days from now
      }
    };
    await this.dbClient.updateRecordProperties(updateParams);
  }

  public async markMessageAsMaxRetriesReached(
    message: IDeadLetterMessage
  ): Promise<void> {
    const updateParams: EntityUpdateParams = {
      table: DbTable.DeadLetterMessages, // Enum value representing the table
      partitionKeyValue: message.id,
      updates: {
        maxAutoRetriesReached: true
      }
    };
    await this.dbClient.updateRecordProperties(updateParams);
  }
}
