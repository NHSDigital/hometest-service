import type { IMnsMessageLog } from '@dnhc-health-checks/shared';
import { DynamoDBService } from './DynamoDBService';

export class MnsCommunicationLogService extends DynamoDBService {
  private readonly tableName: string;
  constructor(envName: string) {
    super(envName);
    this.tableName = `${envName}-nhc-mns-messages-log-db`;
  }

  public async waitForItemByHealthCheckId(
    healthCheckId: string,
    maxRetries = 30,
    delayMs = 1000
  ): Promise<IMnsMessageLog> {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const item = await this.getItemByHealthCheckId(healthCheckId);
        console.log(
          `Found MNS Message Log item for healthCheckId ${healthCheckId}:`,
          { item }
        );
        return item;
      } catch {
        await this.pause(delayMs);
        retries++;
      }
    }
    throw new Error(
      `Item with healthCheckId ${healthCheckId} not found after ${maxRetries} retries`
    );
  }

  public async getItemByHealthCheckId(
    healthCheckId: string
  ): Promise<IMnsMessageLog> {
    const allItems = (await this.getAllItems(
      this.tableName
    )) as IMnsMessageLog[];
    const item = allItems.find((i) => i.healthCheckId === healthCheckId);
    if (item) {
      return item;
    } else {
      throw new Error(
        `Could not get MNS Message Log with healthCheckId ${healthCheckId}`
      );
    }
  }

  public async deleteItemsByHealthCheckId(
    healthCheckId: string
  ): Promise<void> {
    try {
      const item = await this.getItemByHealthCheckId(healthCheckId);
      await this.deleteItemByPartitionKey(this.tableName, 'id', item.id);
    } catch {
      console.log(
        `No MNS Message Log items found for healthCheckId ${healthCheckId}, skipping deletion.`
      );
    }
  }

  public async deleteAllItems(): Promise<void> {
    let items = this.getAllItems(this.tableName) as Promise<IMnsMessageLog[]>;
    for (const item of await items) {
      await this.deleteItemByPartitionKey(this.tableName, 'id', item.id);
    }
  }
}
