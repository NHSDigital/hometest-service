import { DynamoDBService } from './DynamoDBService';

export enum DeadLetterMessageStatus {
  New = 'New',
  Redriven = 'Redriven'
}

export interface DeadLetterMessageItem {
  id: string;
  queueName: string;
  messageId: string;
  messageCreationTime: string;
  addToDbTime: string;
  messageBody: string;
  status: DeadLetterMessageStatus;
  deleteTime?: number; // UNIX epoch in seconds - used for TTL
  maxAutoRetriesReached: boolean;
  originalMessageId: string;
  retries: number;
}

export default class DbDeadLetterMessagesService extends DynamoDBService {
  private getTableName(): string {
    return `${this.envName}-nhc-dead-letter-messages-db`;
  }

  async createDeadLetterMessageItem(
    deadLetterMessageItem: DeadLetterMessageItem
  ): Promise<void> {
    await this.putItem(this.getTableName(), deadLetterMessageItem);
  }

  async getAllDeadLetterMessageItem(): Promise<DeadLetterMessageItem[]> {
    return await this.getAllItems(this.getTableName());
  }

  async getDeadLetterMessageItemById(
    deadLetterMessageId: string
  ): Promise<DeadLetterMessageItem> {
    return (await this.getJsonItemByPartitionKey(
      this.getTableName(),
      'id',
      deadLetterMessageId
    )) as DeadLetterMessageItem;
  }

  async getDeadLetterMessageItemsByQueueName(
    queueName: string
  ): Promise<DeadLetterMessageItem[]> {
    return await this.queryItemsByIndex<DeadLetterMessageItem>(
      this.getTableName(),
      'queueNameIndex',
      'queueName',
      queueName
    );
  }

  async waitForDeadLetterMessage(
    messageId: string,
    queueName: string,
    maxAttempts: number = 10,
    delayMs: number = 3000
  ): Promise<DeadLetterMessageItem | undefined> {
    let attempts = 0;
    let foundMessage: DeadLetterMessageItem | undefined;

    while (attempts < maxAttempts) {
      const response =
        await this.getDeadLetterMessageItemsByQueueName(queueName);
      console.log(
        `List of DeadLetterMessage db items for queueName '${queueName}': ${JSON.stringify(response, null, 2)}`
      );

      foundMessage = response.find(
        (message) => message.messageId === messageId
      );
      if (foundMessage) {
        return foundMessage;
      }

      attempts++;
      if (attempts < maxAttempts) {
        await this.pause(delayMs);
      }
    }

    console.log(
      'Max attempts reached: Unable to retrieve DeadLetterMessage db item'
    );
    return undefined;
  }

  async waitForDeadLetterMessageByQueueName(
    queueName: string,
    filterDate: string,
    maxAttempts: number = 20,
    delayMs: number = 10000
  ): Promise<DeadLetterMessageItem | undefined> {
    let attempts = 0;
    let foundMessage: DeadLetterMessageItem | undefined;

    while (attempts < maxAttempts) {
      const response =
        await this.getDeadLetterMessageItemsByQueueName(queueName);
      console.log(
        `List of DeadLetterMessage db items for queueName '${queueName}': ${JSON.stringify(response, null, 2)}`
      );

      foundMessage = response.find(
        (message) => message.messageCreationTime > filterDate
      );
      if (foundMessage) {
        return foundMessage;
      }

      attempts++;
      if (attempts < maxAttempts) {
        await this.pause(delayMs);
      }
    }

    console.log(
      'Max attempts reached: Unable to retrieve DeadLetterMessage db item'
    );
    return undefined;
  }

  async deleteDeadLetterMessageItemById(id: string): Promise<void> {
    await this.deleteItemByPartitionKey(this.getTableName(), 'id', id);
  }

  async deleteDeadLetterMessageItemsByQueueName(
    queueName: string
  ): Promise<void> {
    const nhsNumberItems =
      await this.getDeadLetterMessageItemsByQueueName(queueName);
    await Promise.all(
      nhsNumberItems.map(async (item: DeadLetterMessageItem) => {
        await this.deleteDeadLetterMessageItemById(item.id);
      })
    );
  }

  async deleteAllDeadLetterMessageItems(): Promise<void> {
    const dqlItems = await this.getAllDeadLetterMessageItem();
    await Promise.all(
      dqlItems.map(async (item: DeadLetterMessageItem) => {
        await this.deleteDeadLetterMessageItemById(item.id);
      })
    );
  }
}
