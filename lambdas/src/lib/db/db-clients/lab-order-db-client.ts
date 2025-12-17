import { type Commons } from '../../commons';
import { type ILabOrder } from '@dnhc-health-checks/shared/model/lab-order';
import { Service } from '../../service';
import { type DbClient } from '../db-client';
import { DbTable } from '../db-tables';
import {
  type EntityUpdateParams,
  type EntityCreateParams,
  type EntityFetchParams,
  type EntityDeleteParams
} from '../entity-update-params';

export class LabOrderDbClient extends Service {
  readonly dbClient: DbClient;

  constructor(commons: Commons, dbClient: DbClient) {
    super(commons, 'LabOrderDbClient');
    this.dbClient = dbClient;
  }

  public async createNewOrder(labOrder: Partial<ILabOrder>): Promise<void> {
    this.logger.debug('about to create a lab order', {
      healthCheckId: labOrder.healthCheckId
    });

    const createParams: EntityCreateParams = {
      table: DbTable.LabOrders,
      item: labOrder
    };
    await this.dbClient.createRecord(createParams);
  }

  public async updateOrder(orderId: string, updates: any): Promise<void> {
    const updateParams: EntityUpdateParams = {
      table: DbTable.LabOrders,
      partitionKeyValue: orderId,
      updates
    };

    await this.dbClient.updateRecordProperties(updateParams);
  }

  public async getOrdersForHealthCheck(
    healthCheckId: string
  ): Promise<ILabOrder[]> {
    const fetchParams: EntityFetchParams = {
      table: DbTable.LabOrders,
      partitionKeyName: 'healthCheckId',
      partitionKeyValue: healthCheckId,
      indexName: 'healthCheckIdIndex'
    };

    return await this.dbClient.getRecordsByPartitionKey<ILabOrder>(fetchParams);
  }

  public async getOrderById(orderId: string): Promise<ILabOrder> {
    const fetchParams: EntityFetchParams = {
      table: DbTable.LabOrders,
      partitionKeyValue: orderId
    };
    return await this.dbClient.getRecordById<ILabOrder>(fetchParams);
  }

  public async deleteOrder(orderId: string): Promise<void> {
    const deleteParams: EntityDeleteParams = {
      table: DbTable.LabOrders,
      partitionKeyValue: orderId
    };
    await this.dbClient.deleteRecord(deleteParams);
  }
}
