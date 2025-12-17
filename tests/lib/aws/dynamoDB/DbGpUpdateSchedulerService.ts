import { type ScheduledReason } from '../../apiClients/HealthCheckModel';
import { DynamoDBService } from './DynamoDBService';

export interface GpUpdateSchedulerItem {
  scheduleId: string;
  createdAt: string;
  healthCheckId: string;
  scheduleReason: string;
  status: string;
}

export default class DbGpUpdateSchedulerService extends DynamoDBService {
  private getTableName(): string {
    return `${this.envName}-nhc-gp-update-scheduler-db`;
  }

  async deleteGpUpdateSchedulerItem(scheduleId: string): Promise<void> {
    await this.deleteItemByPartitionKey(
      this.getTableName(),
      'scheduleId',
      scheduleId
    );
  }

  async deleteGpUpdateSchedulerItemByHealthCheckId(
    healthCheckId: string
  ): Promise<void> {
    const gpUpdateSchedulerItems =
      await this.getGpUpdateSchedulerItemsByHealthCheckId(healthCheckId);
    await Promise.all(
      gpUpdateSchedulerItems.map(async (item) => {
        await this.deleteGpUpdateSchedulerItem(item.scheduleId);
      })
    );
  }

  async deleteAllGpUpdateSchedulerItems(): Promise<void> {
    const gpUpdateSchedulerItems =
      await this.getAllItems<GpUpdateSchedulerItem>(this.getTableName());

    await Promise.all(
      gpUpdateSchedulerItems.map(async (item) => {
        await this.deleteGpUpdateSchedulerItem(item.scheduleId);
      })
    );
  }

  async getGpUpdateSchedulerItemById(
    scheduleId: string
  ): Promise<GpUpdateSchedulerItem> {
    return (await this.getJsonItemByPartitionKey(
      this.getTableName(),
      'scheduleId',
      scheduleId
    )) as GpUpdateSchedulerItem;
  }

  async getGpUpdateSchedulerItemsByHealthCheckId(
    healthCheckId: string
  ): Promise<GpUpdateSchedulerItem[]> {
    const response = await this.queryItemsByIndex<GpUpdateSchedulerItem>(
      this.getTableName(),
      'healthCheckIdIndex',
      'healthCheckId',
      healthCheckId
    );
    console.log(
      `Gp Update Scheduler db items for healthCheckId '${healthCheckId}':`,
      {
        response
      }
    );
    return response;
  }

  async getAllGpSchedulerItemsByHealthCheckIdAndFilterByCreationDate(
    healthCheckId: string,
    filterDate: string
  ): Promise<GpUpdateSchedulerItem[]> {
    return (
      await this.getGpUpdateSchedulerItemsByHealthCheckId(healthCheckId)
    ).filter((item) => item.createdAt > filterDate);
  }

  async createGpSchedulerItem(scheduler: GpUpdateSchedulerItem): Promise<void> {
    await this.putItem(this.getTableName(), scheduler);
    console.log('Scheduler db item created');
  }

  async waitForGpSchedulerItemsByHealthCheckId(
    healthCheckId: string,
    expectedScheduledReason: ScheduledReason,
    filterDate: string,
    maxAttempts: number = 10,
    delayMs: number = 2000
  ): Promise<boolean> {
    let attempts = 0;
    let result = false;

    while (attempts < maxAttempts) {
      const response =
        await this.getAllGpSchedulerItemsByHealthCheckIdAndFilterByCreationDate(
          healthCheckId,
          filterDate
        );
      console.log(
        `List of GpScheduler items db items for healthCheck id '${healthCheckId}': ${JSON.stringify(response, null, 2)}`
      );

      response.forEach((element: GpUpdateSchedulerItem) => {
        if (element.scheduleReason === (expectedScheduledReason as string)) {
          result = true;
        }
      });

      if (result) return result;

      attempts++;
      if (attempts < maxAttempts) {
        await this.pause(delayMs); // pause before the next attempt
      }
    }

    console.log('Max attempts reached: Unable to retrieve gp scheduler data');
    return false;
  }
}
