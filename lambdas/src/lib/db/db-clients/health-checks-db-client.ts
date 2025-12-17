import {
  type EntityCreateParams,
  type EntityFetchParams,
  type EntityUpdateParams
} from '../entity-update-params';
import { type DbClient } from '../db-client';
import { DbTable } from '../db-tables';
import {
  type AutoExpiryStatus,
  type BloodTestExpiryWritebackStatus,
  type HealthCheckSteps,
  type IHealthCheck
} from '@dnhc-health-checks/shared';
import { Service } from '../../service';
import { type Commons } from '../../commons';

export class HealthCheckDbClient extends Service {
  readonly dbClient: DbClient;

  constructor(commons: Commons, dbClient: DbClient) {
    super(commons, 'HealthCheckDbClient');
    this.dbClient = dbClient;
  }

  public async insertHealthCheck(healthCheck: IHealthCheck): Promise<void> {
    const createParams: EntityCreateParams = {
      table: DbTable.HealthChecks,
      item: healthCheck
    };

    await this.dbClient.createRecord(createParams);
  }

  public async getHealthCheckById(
    healthCheckId: string
  ): Promise<IHealthCheck> {
    const fetchParams: EntityFetchParams = {
      table: DbTable.HealthChecks,
      partitionKeyValue: healthCheckId
    };

    return await this.dbClient.getRecordById<IHealthCheck>(fetchParams);
  }

  public async updateHealthCheck(
    healthCheckId: string,
    partialObject: Record<string, any>,
    removals?: string[]
  ): Promise<IHealthCheck> {
    const updateParams: EntityUpdateParams = getUpdateParams(
      healthCheckId,
      partialObject
    );
    if (removals !== undefined) {
      updateParams.removals = removals;
    }

    return await this.dbClient.updateRecordProperties<IHealthCheck>(
      updateParams
    );
  }

  public async getHealthChecksByNhsNumber(
    nhsNumber: string
  ): Promise<IHealthCheck[]> {
    const fetchParams: EntityFetchParams = {
      table: DbTable.HealthChecks,
      partitionKeyName: 'nhsNumber',
      partitionKeyValue: nhsNumber,
      indexName: 'nhsNumberIndex'
    };
    const results =
      await this.dbClient.getRecordsByPartitionKey<IHealthCheck>(fetchParams);

    this.logger.debug('Health checks for patient fetched successfully', {
      results: results?.map((healthCheck) => healthCheck.id)
    });

    return results;
  }

  public async getHealthChecksByStep(
    step: HealthCheckSteps
  ): Promise<IHealthCheck[]> {
    const fetchParams: EntityFetchParams = {
      table: DbTable.HealthChecks,
      partitionKeyName: 'step',
      partitionKeyValue: step,
      indexName: 'stepIndex'
    };
    const results =
      await this.dbClient.getRecordsByPartitionKey<IHealthCheck>(fetchParams);

    this.logger.debug('Health checks for step fetched successfully', {
      results: results?.map((healthCheck) => healthCheck.id)
    });

    return results;
  }

  public async getHealthChecksByStepAndBloodTestExpiryWritebackStatus(
    step: HealthCheckSteps,
    bloodTestExpiryWritebackStatus: BloodTestExpiryWritebackStatus
  ): Promise<IHealthCheck[]> {
    const fetchParams: EntityFetchParams = {
      table: DbTable.HealthChecks,
      partitionKeyName: 'bloodTestExpiryWritebackStatus',
      partitionKeyValue: bloodTestExpiryWritebackStatus,
      sortKeyName: 'step',
      sortKeyValue: step,
      indexName: 'bloodTestExpiryWritebackStatusStepIndex'
    };
    const results =
      await this.dbClient.getRecordsByPartitionKey<IHealthCheck>(fetchParams);

    this.logger.debug(
      'Health checks for step and bloodTestExpiryWritebackStatus fetched successfully',
      {
        results: results?.map((healthCheck) => healthCheck.id)
      }
    );

    return results;
  }

  public async getHealthChecksByStepAndExpiryStatus(
    step: HealthCheckSteps,
    expiryStatus: AutoExpiryStatus
  ): Promise<IHealthCheck[]> {
    const fetchParams: EntityFetchParams = {
      table: DbTable.HealthChecks,
      partitionKeyName: 'expiryStatus',
      partitionKeyValue: expiryStatus,
      sortKeyName: 'step',
      sortKeyValue: step,
      indexName: 'expiryStatusStepIndex'
    };
    const results =
      await this.dbClient.getRecordsByPartitionKey<IHealthCheck>(fetchParams);

    this.logger.debug(
      'Health checks for step and expiryStatus fetched successfully',
      {
        results: results?.map((healthCheck) => healthCheck.id)
      }
    );

    return results;
  }
}

function getUpdateParams(
  healthCheckId: string,
  updates: any
): EntityUpdateParams {
  return {
    table: DbTable.HealthChecks,
    partitionKeyValue: healthCheckId,
    updates,
    returnValues: 'ALL_NEW'
  };
}
