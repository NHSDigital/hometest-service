import { type DbClient } from '../db-client';
import { DbTable } from '../db-tables';
import {
  type EntityFetchParams,
  type EntityCreateParams,
  type EntityDeleteParams
} from '../entity-update-params';
import { type ILabResult } from '@dnhc-health-checks/shared';
import { Service } from '../../service';
import { type Commons } from '../../commons';

export class LabResultsDbClient extends Service {
  readonly dbClient: DbClient;
  constructor(commons: Commons, dbClient: DbClient) {
    super(commons, 'LabResultsDbClient');
    this.dbClient = dbClient;
  }

  public async insertLabResult(labResult: ILabResult): Promise<void> {
    const createParams: EntityCreateParams = {
      table: DbTable.LabResults,
      item: labResult,
      conditionExpression:
        'attribute_not_exists(orderId) AND attribute_not_exists(testType)'
    };
    await this.dbClient.createRecord(createParams);
  }

  public async getResultsForHealthCheck(
    healthCheckId: string
  ): Promise<ILabResult[]> {
    this.logger.info('about to fetch lab results by health check id', {
      healthCheckId
    });

    const fetchParams: EntityFetchParams = {
      table: DbTable.LabResults,
      partitionKeyName: 'healthCheckId',
      partitionKeyValue: healthCheckId,
      indexName: 'healthCheckIdIndex'
    };

    return await this.dbClient.getRecordsByPartitionKey<ILabResult>(
      fetchParams
    );
  }

  public async deleteResult(orderId: string, testType: string): Promise<void> {
    this.logger.info('about to delete lab result', {
      orderId,
      testType
    });

    const deleteParams: EntityDeleteParams = {
      table: DbTable.LabResults,
      partitionKeyValue: orderId,
      sortKeyValue: testType
    };

    await this.dbClient.deleteRecord(deleteParams);
  }
}
