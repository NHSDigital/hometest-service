import { DynamoDBService } from './DynamoDBService';

export interface ICommunicationLogItem {
  healthCheckId: string;
  type?: CommunicationLogType;
  createdAt: string;
  receivedAt?: string;
  messageId: string;
  messageReference: string;
  messageStatus?: string;
  messageStatusDescription?: string;
  ttl?: number;
  channels?: string[];
}

export enum CommunicationLogType {
  ResultsAll = 'ResultsAll',
  ResultsNotAll = 'ResultsNotAll'
}

export default class DbCommunicationLogService extends DynamoDBService {
  private getTableName(): string {
    return `${this.envName}-nhc-communication-log-db`;
  }

  async createCommunicationLogItem(
    communicationLogItem: ICommunicationLogItem
  ): Promise<void> {
    await this.putItem(this.getTableName(), communicationLogItem);
  }

  async updateCommunicationLogItemHealthCheckId(
    messageReference: string,
    healthCheckId: string
  ): Promise<void> {
    await this.updateItemByPartitionKey(
      this.getTableName(),
      'messageReference',
      messageReference,
      'healthCheckId',
      healthCheckId,
      'S',
      'S'
    );
  }

  private async getAllCommunicationLogItems(): Promise<
    ICommunicationLogItem[]
  > {
    return await this.getAllItems(this.getTableName());
  }

  async getCommunicationLogItemByMessageReference(
    messageReference: string
  ): Promise<ICommunicationLogItem> {
    return (await this.getJsonItemByPartitionKey(
      this.getTableName(),
      'messageReference',
      messageReference
    )) as ICommunicationLogItem;
  }

  async getCommunicationLogByHealthCheckId(
    healthCheckId: string
  ): Promise<ICommunicationLogItem[]> {
    return (await this.getAllCommunicationLogItems()).filter(
      (item: ICommunicationLogItem) => item.healthCheckId === healthCheckId
    );
  }

  async waitForCommunicationItemsByHealthCheckId(
    healthCheckId: string,
    maxAttempts: number = 5,
    delayMs: number = 2000
  ): Promise<ICommunicationLogItem | undefined> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response =
        await this.getCommunicationLogByHealthCheckId(healthCheckId);

      if (response.length > 0) {
        return response[0];
      }

      attempts++;
      if (attempts < maxAttempts) {
        await this.pause(delayMs);
      }
    }

    console.log(
      'Max attempts reached: Unable to retrieve Communication db item'
    );
    return undefined;
  }

  async deleteCommunicationLogByMessageReference(
    messageReference: string
  ): Promise<void> {
    await this.deleteItemByPartitionKey(
      this.getTableName(),
      'messageReference',
      messageReference
    );
  }

  async deleteAllCommunicationLogByHealthCheckId(
    healthCheckId: string
  ): Promise<void> {
    const communicationLogItems =
      await this.getCommunicationLogByHealthCheckId(healthCheckId);
    await Promise.all(
      communicationLogItems.map(async (item: ICommunicationLogItem) => {
        await this.deleteCommunicationLogByMessageReference(
          item.messageReference
        );
      })
    );
  }

  async deleteAllCommunicationLogItems(): Promise<void> {
    const communicationLogItemList: ICommunicationLogItem[] =
      await this.getAllCommunicationLogItems();
    await Promise.all(
      communicationLogItemList.map(async (item: ICommunicationLogItem) => {
        await this.deleteCommunicationLogByMessageReference(
          item.messageReference
        );
      })
    );
  }
}
