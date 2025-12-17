import {
  type EntityScanParams,
  type EntityDeleteParams,
  type EntityFetchParams,
  type EntityUpdateParams,
  type EntityCreateParams
} from '../entity-update-params';
import { type DbClient } from '../db-client';
import { DbTable } from '../db-tables';
import { Service } from '../../service';
import { type Commons } from '../../commons';
import { type IGpUpdateScheduler } from '../../models/gp-update/gp-update-scheduler';

export class GpUpdateSchedulerDbClient extends Service {
  readonly dbClient: DbClient;
  constructor(commons: Commons, dbClient: DbClient) {
    super(commons, 'GpUpdateSchedulerDbClient');
    this.dbClient = dbClient;
  }

  async insertGpUpdateTask(gpUpdateTask: IGpUpdateScheduler): Promise<void> {
    this.logger.debug('About to insert a new gp update schedule', {
      scheduleId: gpUpdateTask.scheduleId
    });
    const createParams: EntityCreateParams = {
      table: DbTable.GpUpdateScheduler,
      item: gpUpdateTask
    };
    await this.dbClient.createRecord(createParams);
  }

  public async getGpUpdateTaskById(
    scheduleId: string
  ): Promise<IGpUpdateScheduler> {
    const fetchParams: EntityFetchParams = {
      table: DbTable.GpUpdateScheduler,
      partitionKeyValue: scheduleId
    };

    return await this.dbClient.getRecordById<IGpUpdateScheduler>(fetchParams);
  }

  public async getAllGpUpdateTasks(): Promise<IGpUpdateScheduler[]> {
    const fetchParams: EntityScanParams = {
      table: DbTable.GpUpdateScheduler
    };

    return await this.dbClient.getAllRecords<IGpUpdateScheduler>(fetchParams);
  }

  public async getGpUpdateTasksByHealthCheckId(
    healthCheckId: string
  ): Promise<IGpUpdateScheduler[]> {
    const fetchParams: EntityFetchParams = {
      table: DbTable.GpUpdateScheduler,
      partitionKeyName: 'healthCheckId',
      partitionKeyValue: healthCheckId,
      indexName: 'healthCheckIdIndex'
    };

    return await this.dbClient.getRecordsByPartitionKey<IGpUpdateScheduler>(
      fetchParams
    );
  }

  public async updateGpUpdateTask(
    scheduleId: string,
    partialObject: Record<string, any>,
    removals?: string[]
  ): Promise<IGpUpdateScheduler> {
    const updateParams: EntityUpdateParams = {
      table: DbTable.GpUpdateScheduler,
      partitionKeyValue: scheduleId,
      updates: partialObject,
      returnValues: 'ALL_NEW'
    };
    if (removals !== undefined) {
      updateParams.removals = removals;
    }

    return await this.dbClient.updateRecordProperties<IGpUpdateScheduler>(
      updateParams
    );
  }

  public async deleteGpUpdateTask(scheduleId: string): Promise<void> {
    const deleteParams: EntityDeleteParams = {
      table: DbTable.GpUpdateScheduler,
      partitionKeyValue: scheduleId
    };
    await this.dbClient.deleteRecord(deleteParams);
  }
}
