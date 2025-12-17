import {
  type EntityScanParams,
  type EntityCreateParams,
  type EntityFetchParams,
  type EntityUpdateParams,
  type EntityDeleteParams
} from './entity-update-params';
import { type IBatchInput } from '../models/data-load/batch-input';
import { Service } from '../service';
import { type Commons } from '../commons';
import {
  type IDbClient,
  type DbClient,
  type BatchUpdateResult
} from './db-client';
import { type DbTable } from './db-tables';
import NodeCache from 'node-cache';

const dbCache = new NodeCache({
  stdTTL: 60 * 60,
  useClones: true,
  errorOnMissing: true,
  deleteOnExpire: true
});

/**
 * Cached db client. It uses table scans to store up entire table in memory.
 * It is NOT appropriate for very large tables.
 */
export class CachedDbClient extends Service implements IDbClient {
  INIT_IN_PROGRESS_KEY_PREFIX = 'initInProgress-';
  readonly dbClient: DbClient;

  /**
   * CachedDbClient constructor, caching is done here if dbTable is supplied
   *
   * @param commons
   * @param dbClient Instance of uncached DDB client
   */
  constructor(commons: Commons, dbClient: DbClient) {
    super(commons, 'CachedDbClient');
    this.dbClient = dbClient;
  }

  public async initCache(dbTable: DbTable): Promise<void> {
    if (
      dbCache.get(`${this.INIT_IN_PROGRESS_KEY_PREFIX}${dbTable}`) !== true &&
      dbCache.get(dbTable) === undefined
    ) {
      this.logger.info('Caching table initiated', { dbTable });
      dbCache.set(`${this.INIT_IN_PROGRESS_KEY_PREFIX}${dbTable}`, true);
      const cachePromise = this.dbClient
        .getAllRecords({ table: dbTable })
        .then((scanData) => {
          dbCache.set(dbTable, scanData);
        })
        .catch((error) => {
          this.logger.error('Error while caching results', {
            dbTable,
            error
          });

          throw error;
        })
        .finally(() => {
          dbCache.set(`${this.INIT_IN_PROGRESS_KEY_PREFIX}${dbTable}`, false);
          dbCache.set(`${dbTable}-promise`, undefined);
        });
      dbCache.set(`${dbTable}-promise`, cachePromise);
      await cachePromise;
    } else {
      this.logger.info('Caching in progress, new caching request ignored', {
        dbTable
      });
      const cachePromise = dbCache.get(`${dbTable}-promise`);
      if (cachePromise instanceof Promise) {
        await cachePromise;
      }
      dbCache.set(`${dbTable}-promise`, undefined);
    }
  }

  private clearCache(dbTable: DbTable): void {
    if (dbCache.get(`${this.INIT_IN_PROGRESS_KEY_PREFIX}${dbTable}`) === true) {
      this.logger.debug('Caching in progress, not clearing the cache', {
        dbTable
      });
    } else {
      this.logger.debug('Clearing the cache', { dbTable });
      dbCache.del(dbTable);
    }
  }

  private async updateCache(dbTable: DbTable): Promise<void> {
    this.clearCache(dbTable);
    await this.initCache(dbTable);
  }

  public async getRecordsByPartitionKey<TResult>(
    fetchParams: EntityFetchParams
  ): Promise<TResult[]> {
    const tableDetails = this.dbClient.getTableDetails(fetchParams.table);
    const partitionKeyUsed =
      fetchParams.partitionKeyName ?? tableDetails.partitionKeyName;
    const filterPredicate = (item: TResult): boolean =>
      item[partitionKeyUsed] === fetchParams.partitionKeyValue;

    this.logger.debug('About to fetch cached records from table', {
      [partitionKeyUsed]: fetchParams.partitionKeyValue,
      tableName: tableDetails.tableName
    });

    let items: TResult[] | undefined = dbCache.get(fetchParams.table);
    let filteredItems = items?.filter((item) => filterPredicate(item));

    if (filteredItems === undefined || filteredItems.length === 0) {
      this.logger.debug(
        'Records not found in the cache, trying to update the cache',
        {
          [partitionKeyUsed]: fetchParams.partitionKeyValue,
          tableName: tableDetails.tableName
        }
      );
      await this.updateCache(fetchParams.table);
      items = dbCache.get(fetchParams.table);
      filteredItems = items?.filter((item) => filterPredicate(item)) ?? [];
    }
    return filteredItems;
  }

  public async getRecordById<TResult>(
    fetchParams: EntityFetchParams
  ): Promise<TResult> {
    const record = await this.getOptionalRecordById<TResult>(fetchParams);
    if (record === undefined) {
      const msg = 'Empty response - record not found';
      this.logger.error('Could not fetch record from table', {
        error: msg,
        key: fetchParams.partitionKeyName,
        keyValue: fetchParams.partitionKeyValue,
        tableName: this.dbClient.getTableDetails(fetchParams.table).tableName
      });
      throw new Error(msg);
    }
    this.logger.debug('Record fetched successfully', { record });
    return record;
  }

  public async getOptionalRecordById<TResult>(
    fetchParams: EntityFetchParams
  ): Promise<TResult | undefined> {
    const tableDetails = this.dbClient.getTableDetails(fetchParams.table);
    const filterPredicate = (item: TResult): boolean =>
      item[tableDetails.partitionKeyName] === fetchParams.partitionKeyValue;

    this.logger.debug('About to fetch cached record from table', {
      [tableDetails.partitionKeyName]: fetchParams.partitionKeyValue,
      tableName: tableDetails.tableName
    });

    let items: TResult[] | undefined = dbCache.get(fetchParams.table);
    let item = items?.find((item) => filterPredicate(item));

    if (item === undefined) {
      this.logger.debug(
        'Record not found in the cache, trying to update the cache',
        {
          [tableDetails.partitionKeyName]: fetchParams.partitionKeyValue,
          tableName: tableDetails.tableName
        }
      );
      await this.updateCache(fetchParams.table);
      items = dbCache.get(fetchParams.table);
      item = items?.find((item) => filterPredicate(item));
    }
    return item;
  }

  public async getAllRecords<TResult>(
    scanParams: EntityScanParams
  ): Promise<TResult[]> {
    let items: TResult[] | undefined = dbCache.get(scanParams.table);

    if (items === undefined) {
      await this.initCache(scanParams.table);
      items = dbCache.get(scanParams.table);
    }
    if (scanParams.filterBy !== undefined) {
      const filterParams = scanParams.filterBy;
      items = items?.filter(
        (item) => item[filterParams.key] === filterParams.value
      );
    }
    return items ?? [];
  }

  public async createRecord(createParams: EntityCreateParams): Promise<void> {
    dbCache.set(createParams.table, undefined);
    await this.dbClient.createRecord(createParams);
  }

  public async updateRecordProperties<TResult>(
    updateParams: EntityUpdateParams
  ): Promise<TResult[]> {
    dbCache.set(updateParams.table, undefined);
    return await this.dbClient.updateRecordProperties(updateParams);
  }

  public async batchUpdate(
    tableName: string,
    batchUpdateInput: IBatchInput
  ): Promise<void> {
    for (const key of dbCache.keys()) {
      dbCache.set(key, undefined);
    }
    await this.dbClient.batchUpdate(tableName, batchUpdateInput);
  }

  public async parallelBatchUpdate(
    tableName: string,
    batchUpdateInput: IBatchInput,
    maxConcurrentBatches?: number | undefined
  ): Promise<BatchUpdateResult> {
    this.logger.debug('Parallel batch update called, clearing entire cache.', {
      tableName
    });

    for (const key of dbCache.keys()) {
      dbCache.set(key, undefined);
    }
    return await this.dbClient.parallelBatchUpdate(
      tableName,
      batchUpdateInput,
      maxConcurrentBatches
    );
  }

  public async deleteRecord(deleteParams: EntityDeleteParams): Promise<void> {
    dbCache.set(deleteParams.table, undefined);
    await this.dbClient.deleteRecord(deleteParams);
  }
}
