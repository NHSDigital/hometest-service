import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  type EntityScanParams,
  type EntityCreateParams,
  type EntityFetchParams,
  type EntityUpdateParams,
  type EntityDeleteParams
} from './entity-update-params';
import {
  DbTableDetailsMap,
  type DbTableDetails,
  type DbTable
} from './db-tables';
import {
  DynamoDBDocument,
  type ScanCommandInput,
  type ScanCommandOutput,
  type GetCommandInput,
  type PutCommandInput,
  type UpdateCommandInput,
  type BatchWriteCommandInput,
  type QueryCommandInput,
  type DeleteCommandInput,
  type QueryCommandOutput
} from '@aws-sdk/lib-dynamodb';
import { type IBatchInput } from '../models/data-load/batch-input';
import { type Commons } from '../commons';
import { DbRecordNotFoundError } from '../errors/db-errors';
import { AWSService } from '../aws-service';

export interface IDbClient {
  getRecordsByPartitionKey: <TResult>(
    fetchParams: EntityFetchParams
  ) => Promise<TResult[]>;
  getRecordById: <TResult>(fetchParams: EntityFetchParams) => Promise<TResult>;
  getOptionalRecordById: <TResult>(
    fetchParams: EntityFetchParams
  ) => Promise<TResult | undefined>;
  getAllRecords: <TResult>(scanParams: EntityScanParams) => Promise<TResult[]>;
  createRecord: (createParams: EntityCreateParams) => Promise<void>;
  deleteRecord: (deleteParams: EntityDeleteParams) => Promise<void>;
  updateRecordProperties: <TResult>(
    updateParams: EntityUpdateParams
  ) => Promise<TResult[]>;
  batchUpdate: (
    tableName: string,
    batchUpdateInput: IBatchInput
  ) => Promise<void>;
  parallelBatchUpdate: <TItem = any>(
    tableName: string,
    batchUpdateInput: IBatchInput,
    maxConcurrentBatches?: number
  ) => Promise<BatchUpdateResult<TItem>>;
}

export class DbClient
  extends AWSService<DynamoDBDocument>
  implements IDbClient
{
  db: DynamoDBDocument;

  excludeFromLogs = ['nhsNumber'];
  constructor(
    commons: Commons,
    client: DynamoDBDocument = DynamoDBDocument.from(new DynamoDBClient({}))
  ) {
    super(commons, 'DbClient', client);
  }

  public async getRecordsByPartitionKey<TResult>(
    fetchParams: EntityFetchParams
  ): Promise<TResult[]> {
    const tableDetails = this.getTableDetails(fetchParams.table);
    const partitionKeyUsed =
      fetchParams.partitionKeyName ?? tableDetails.partitionKeyName;
    const sortKeyExpression = fetchParams.sortKeyName
      ? ` AND ${fetchParams.sortKeyName} = :sortKeyValue`
      : '';

    this.logDbOperationDebug('about to fetch records from table', {
      [partitionKeyUsed]: fetchParams.partitionKeyValue,
      ...(fetchParams.sortKeyName && {
        [fetchParams.sortKeyName]: fetchParams.sortKeyValue
      }),
      tableName: tableDetails.tableName
    });

    try {
      const command: QueryCommandInput = {
        TableName: tableDetails.tableName,
        KeyConditionExpression: `${partitionKeyUsed} = :partitionKeyValue${sortKeyExpression}`,
        ExpressionAttributeValues: {
          ':partitionKeyValue': fetchParams.partitionKeyValue,
          ...(fetchParams.sortKeyValue && {
            ':sortKeyValue': fetchParams.sortKeyValue
          })
        },
        IndexName: fetchParams.indexName
      };

      let result: TResult[] = [];
      let items: QueryCommandOutput;
      do {
        items = await this.client.query(command);
        this.logDbOperationDebug('page of records fetched successfully', {
          tableName: tableDetails.tableName,
          recordsReturned: items.Items?.length,
          lastEvaluatedKey: items.LastEvaluatedKey
        });
        command.ExclusiveStartKey = items.LastEvaluatedKey;

        if (items.Items) {
          result = result.concat(items.Items as TResult[]);
        }
      } while (items.LastEvaluatedKey !== undefined);
      return result;
    } catch (error) {
      this.logDbOperationError('could not fetch records from table', {
        error,
        [partitionKeyUsed]: fetchParams.partitionKeyValue,
        ...(fetchParams.sortKeyName && {
          [fetchParams.sortKeyName]: fetchParams.sortKeyValue
        }),
        tableName: tableDetails.tableName
      });
      throw error;
    }
  }

  public async getRecordById<TResult>(
    fetchParams: EntityFetchParams
  ): Promise<TResult> {
    const record = await this.getOptionalRecordById<TResult>(fetchParams);
    if (record === undefined) {
      const msg = 'Empty response - record not found';
      this.logDbOperationError('Could not fetch record from table', {
        error: msg,
        key: fetchParams.partitionKeyName,
        keyValue: fetchParams.partitionKeyValue,
        tableName: this.getTableDetails(fetchParams.table).tableName
      });
      throw new DbRecordNotFoundError(msg);
    }
    return record;
  }

  public async getOptionalRecordById<TResult>(
    fetchParams: EntityFetchParams
  ): Promise<TResult | undefined> {
    const tableDetails = this.getTableDetails(fetchParams.table);
    this.logDbOperationDebug('About to fetch record from table', {
      [tableDetails.partitionKeyName]: fetchParams.partitionKeyValue,
      tableName: tableDetails.tableName
    });

    const key: any = {};
    key[tableDetails.partitionKeyName] = fetchParams.partitionKeyValue;

    try {
      const command: GetCommandInput = {
        TableName: tableDetails.tableName,
        Key: key
      };
      const record = await this.client.get(command);
      this.logDbOperationDebug('Record fetched successfully');
      return record.Item as TResult;
    } catch (error) {
      this.logDbOperationError('Could not fetch record from table', {
        error,
        [tableDetails.partitionKeyName]: fetchParams.partitionKeyValue,
        tableName: tableDetails.tableName
      });
      throw error;
    }
  }

  public async getAllRecords<TResult>(
    scanParams: EntityScanParams
  ): Promise<TResult[]> {
    const tableDetails = this.getTableDetails(scanParams.table);
    this.logDbOperationDebug('About to fetch all records from table', {
      tableName: tableDetails.tableName
    });

    try {
      const command: ScanCommandInput = {
        TableName: tableDetails.tableName
      };
      if (scanParams.filterBy) {
        const safeFilterByKey = `#${scanParams.filterBy.key}`;
        command.FilterExpression = `${safeFilterByKey} = :scanFilter`;
        command.ExpressionAttributeValues = {
          ':scanFilter': scanParams.filterBy.value
        };
        command.ExpressionAttributeNames = {
          [safeFilterByKey]: `${scanParams.filterBy.key}`
        };
      }
      let scanResult: TResult[] = [];
      let items: ScanCommandOutput;
      do {
        items = await this.client.scan({ ...command });
        this.logDbOperationDebug('Page of records fetched successfully', {
          recordsReturned: items.Items?.length,
          lastEvaluatedKey: items.LastEvaluatedKey
        });
        command.ExclusiveStartKey = items.LastEvaluatedKey;

        if (items.Items) {
          scanResult = scanResult.concat(items.Items as TResult[]);
        }
      } while (items.LastEvaluatedKey !== undefined);
      this.logDbOperationDebug('All records fetched successfully', {
        recordsReturned: scanResult.length
      });
      return scanResult;
    } catch (error) {
      this.logDbOperationError('Could not get all records from table', {
        tableName: tableDetails.tableName,
        error
      });
      throw error;
    }
  }

  public async createRecord(createParams: EntityCreateParams): Promise<void> {
    const tableDetails = this.getTableDetails(createParams.table);
    try {
      this.logDbOperationDebug('about to create a new record in table', {
        tableName: tableDetails.tableName
      });

      const command: PutCommandInput = {
        TableName: tableDetails.tableName,
        Item: createParams.item,
        ConditionExpression: createParams.conditionExpression ?? undefined
      };
      await this.client.put(command);

      this.logDbOperationDebug('record created successfully', {
        tableName: tableDetails.tableName
      });
    } catch (error) {
      this.logDbOperationError('could not create a new record', {
        tableName: tableDetails.tableName,
        error
      });
      throw error;
    }
  }

  public async deleteRecord(deleteParams: EntityDeleteParams): Promise<void> {
    const tableDetails = this.getTableDetails(deleteParams.table);
    this.logDbOperationDebug('About to delete record from table', {
      [tableDetails.partitionKeyName]: deleteParams.partitionKeyValue,
      tableName: tableDetails.tableName
    });

    const key: any = {};
    key[tableDetails.partitionKeyName] = deleteParams.partitionKeyValue;
    if (deleteParams.sortKeyValue !== undefined) {
      if (tableDetails.sortKeyName === undefined) {
        throw new Error(
          `Table ${deleteParams.table} does not have a sortKey defined`
        );
      }
      key[tableDetails.sortKeyName] = deleteParams.sortKeyValue;
    }

    try {
      const command: DeleteCommandInput = {
        TableName: tableDetails.tableName,
        Key: key
      };
      await this.client.delete(command);

      this.logDbOperationDebug('Record deleted successfully', {
        tableName: tableDetails.tableName
      });
    } catch (error) {
      this.logDbOperationError('Could not delete record from table', {
        error,
        [tableDetails.partitionKeyName]: deleteParams.partitionKeyValue,
        tableName: tableDetails.tableName
      });
      throw error;
    }
  }

  public async updateRecordProperties<TResult>(
    updateParams: EntityUpdateParams
  ): Promise<TResult> {
    const tableDetails = this.getTableDetails(updateParams.table);
    try {
      this.logDbOperationDebug('about to update record', {
        [tableDetails.partitionKeyName]: updateParams.partitionKeyValue,
        tableName: tableDetails.tableName
      });

      const commandInput: UpdateCommandInput = mapToUpdateCommandInput(
        tableDetails,
        updateParams
      );
      const response = await this.client.update(commandInput);
      this.logDbOperationDebug('record updated successfully', {
        [tableDetails.partitionKeyName]: updateParams.partitionKeyValue,
        tableName: tableDetails.tableName
      });
      return response.Attributes as TResult;
    } catch (error) {
      this.logDbOperationError('could not update record', {
        [tableDetails.partitionKeyName]: updateParams.partitionKeyValue,
        tableName: tableDetails.tableName,
        error
      });
      throw error;
    }
  }

  public async batchUpdate(
    tableName: string,
    batchUpdateInput: IBatchInput
  ): Promise<void> {
    try {
      this.logDbOperationDebug('about to run batch update', {
        tableName
      });

      if (batchUpdateInput.inserts.length === 0) {
        this.logDbOperationInfo('no data provided to batch update operation', {
          tableName
        });
        return;
      }

      const chunkSize = 25;
      for (let i = 0; i < batchUpdateInput.inserts.length; i += chunkSize) {
        const chunk = batchUpdateInput.inserts.slice(i, i + chunkSize);
        const putRequests = chunk.map((item: any) => ({
          PutRequest: { Item: item }
        }));
        const command: BatchWriteCommandInput = {
          RequestItems: {
            [tableName]: putRequests
          }
        };
        await this.client.batchWrite(command);
        // TODO: verify unprocessed items in the output
        this.logDbOperationDebug('batch update completed successfully', {
          tableName,
          chunkSize: chunk.length
        });
      }
    } catch (error) {
      this.logDbOperationError('could not complete batch update', {
        tableName,
        error
      });
      throw error;
    }
  }

  /**
   * Performs batch updates in parallel with error handling
   * Will process up to maxConcurrentBatches at once
   *
   * @param tableName The table name to update
   * @param batchUpdateInput The batch input containing items to insert
   * @param maxConcurrentBatches The maximum number of concurrent batch operations (default: 4 - more might cause throttling for autoscaling tables)
   * @returns Promise<BatchUpdateResult> with success and error information
   */
  public async parallelBatchUpdate<TItem = any>(
    tableName: string,
    batchUpdateInput: IBatchInput,
    maxConcurrentBatches = 4
  ): Promise<BatchUpdateResult<TItem>> {
    // Get partition key name from table details
    const pkName = this.getPartitionKeyNameByTableName(tableName);
    const result: BatchUpdateResult<TItem> = {
      totalItems: batchUpdateInput.inserts.length,
      successfulItems: [],
      errors: []
    };

    try {
      this.logDbOperationInfo('about to run parallel batch update', {
        tableName,
        totalItems: batchUpdateInput.inserts.length
      });

      if (batchUpdateInput.inserts.length === 0) {
        this.logDbOperationInfo('no data provided to batch update operation', {
          tableName
        });
        return result;
      }

      const chunkSize = 25; // DynamoDB maximum batch size
      const chunks: any[][] = [];

      // Split items into chunks of 25
      for (let i = 0; i < batchUpdateInput.inserts.length; i += chunkSize) {
        chunks.push(batchUpdateInput.inserts.slice(i, i + chunkSize));
      }

      // Process chunks in batches of maxConcurrentBatches
      for (let i = 0; i < chunks.length; i += maxConcurrentBatches) {
        const batchChunks = chunks.slice(i, i + maxConcurrentBatches);
        const batchPromises = batchChunks.map(async (chunk, index) => {
          const maxRetries = 3;
          let attempt = 0;
          let itemsToProcess = chunk;
          const batchIndex = i + index;

          while (attempt < maxRetries && itemsToProcess.length > 0) {
            attempt++;
            const currentBatchItems = [...itemsToProcess];
            try {
              const putRequests = currentBatchItems.map((item: any) => ({
                PutRequest: { Item: item }
              }));
              const command: BatchWriteCommandInput = {
                RequestItems: { [tableName]: putRequests }
              };
              const response = await this.client.batchWrite(command);

              const { successfulItems, itemsToRetry } =
                processBatchWriteResponseItems<TItem>(
                  currentBatchItems,
                  response.UnprocessedItems?.[tableName],
                  pkName
                );

              result.successfulItems.push(...successfulItems);

              if (itemsToRetry.length > 0) {
                this.logDbOperationInfo('retrying unprocessed items in batch', {
                  tableName,
                  batchIndex,
                  attempt,
                  unprocessedItems: itemsToRetry.length
                });
                itemsToProcess = itemsToRetry;
                if (attempt < maxRetries) {
                  await new Promise((resolve) =>
                    setTimeout(resolve, 1000 * attempt)
                  );
                }
              } else {
                itemsToProcess = [];
              }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : String(error);
              this.logDbOperationError(
                `Error during batch write attempt ${attempt}`,
                {
                  tableName,
                  batchIndex,
                  attempt,
                  itemCount: currentBatchItems.length,
                  error
                }
              );

              // If error occurs, assume all items in this attempt might have failed unless retrying
              if (attempt >= maxRetries) {
                for (const item of itemsToProcess) {
                  result.errors.push({ item, error: errorMessage });
                }
                itemsToProcess = [];
              } else {
                await new Promise((resolve) =>
                  setTimeout(resolve, 1000 * attempt)
                );
              }
            }
          }

          // After all retries, any remaining items in itemsToProcess are considered failed
          if (itemsToProcess.length > 0) {
            const finalErrorMessage = `Item failed after ${maxRetries} attempts`;
            for (const item of itemsToProcess) {
              result.errors.push({ item, error: finalErrorMessage });
            }
          }

          this.logDbOperationInfo('batch chunk completed', {
            tableName,
            batchIndex,
            successfulItemsInChunk: result.successfulItems.length,
            failedItemsInChunk: result.errors.length
          });
        });
        await Promise.all(batchPromises);
      }

      this.logDbOperationInfo('parallel batch update completed', {
        tableName,
        totalItems: batchUpdateInput.inserts.length,
        successfulItems: result.successfulItems.length,
        failedItems: result.errors.length
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logDbOperationError('Critical error during parallel batch update', {
        tableName,
        error
      });

      // If a critical error occurs, mark all items not already successful as failed
      const successfulItemIds = new Set(
        result.successfulItems.map((item) => item[pkName])
      );

      for (const item of batchUpdateInput.inserts) {
        if (!successfulItemIds.has(item[pkName])) {
          // Avoid adding duplicates if some already failed via errors array
          if (!result.errors.some((e) => e.item[pkName] === item[pkName])) {
            result.errors.push({ item, error: errorMessage });
          }
        }
      }

      this.logDbOperationError(
        'Final state after critical error in parallel batch update',
        {
          tableName,
          totalItems: batchUpdateInput.inserts.length,
          successfulItems: result.successfulItems.length,
          failedItems: result.errors.length
        }
      );

      return result;
    }
  }

  private logDbOperationInfo(
    msg: string,
    details: Record<string, any> = {}
  ): void {
    const clearedDetails = this.removePiiData(details);
    this.logger.info(msg, { ...clearedDetails });
  }

  private logDbOperationError(
    msg: string,
    details: Record<string, any> = {}
  ): void {
    const clearedDetails = this.removePiiData(details);
    this.logger.error(msg, { ...clearedDetails });
  }

  private logDbOperationDebug(
    msg: string,
    details: Record<string, any> = {}
  ): void {
    const clearedDetails = this.removePiiData(details);
    this.logger.debug(msg, { ...clearedDetails });
  }

  private removePiiData(logDetails: Record<string, any>): Record<string, any> {
    const clearedDetails = { ...logDetails };
    for (const value of this.excludeFromLogs) {
      if (clearedDetails[value] !== undefined) {
        clearedDetails[value] = '*****';
      }
    }

    return clearedDetails;
  }

  public getTableDetails(table: DbTable): DbTableDetails {
    const tableDetails = DbTableDetailsMap.get(table);
    if (tableDetails === undefined) {
      throw new Error(`table ${table} not found`);
    }
    return tableDetails;
  }

  private getPartitionKeyNameByTableName(tableName: string): string {
    for (const details of DbTableDetailsMap.values()) {
      if (details.tableName === tableName) return details.partitionKeyName;
    }
    throw new Error(`Could not determine partition key for table ${tableName}`);
  }
}

function mapToUpdateCommandInput(
  tableDetails: DbTableDetails,
  updateParams: EntityUpdateParams
): UpdateCommandInput {
  const expressionAttributeNames: Record<string, string> = {};
  const updateExpressionFragments: string[] = [];
  const key: any = {};
  key[tableDetails.partitionKeyName] = updateParams.partitionKeyValue;
  if (
    updateParams.sortKeyValue !== undefined &&
    tableDetails.sortKeyName !== undefined
  ) {
    key[tableDetails.sortKeyName] = updateParams.sortKeyValue;
  }

  for (const [attribute] of Object.entries(updateParams.updates)) {
    expressionAttributeNames[`#${attribute}`] = attribute;
    updateExpressionFragments.push(`#${attribute} = :${attribute}`);
  }

  const attributeValues = Object.fromEntries(
    Object.entries(updateParams.updates).map(([k, v]) => [`:${k}`, v])
  );

  let updateExpression = 'SET ' + updateExpressionFragments.join(', ');
  if (updateParams.removals !== undefined && updateParams.removals.length > 0) {
    updateExpression += ` REMOVE ${updateParams.removals.join(', ')}`;
  }

  const input: UpdateCommandInput = {
    TableName: tableDetails.tableName,
    Key: key,
    ExpressionAttributeValues: attributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    UpdateExpression: updateExpression,
    ReturnValues: updateParams.returnValues
  };

  return input;
}

// Helper function to process batch write response
function processBatchWriteResponseItems<TItem = any>(
  currentAttemptItems: any[],
  unprocessedDynamoDBRequests:
    | Array<{ PutRequest?: { Item: any } }>
    | undefined,
  partitionKeyName: string
): { successfulItems: TItem[]; itemsToRetry: any[] } {
  const itemsToRetry = (unprocessedDynamoDBRequests ?? [])
    .map((req) => req.PutRequest?.Item)
    .filter((item): item is any => item !== undefined);

  // If nothing was unprocessed, all items sent in this attempt were successful
  if (itemsToRetry.length === 0) {
    // Ensure currentAttemptItems itself isn't empty before spreading
    return {
      successfulItems:
        currentAttemptItems.length > 0
          ? ([...currentAttemptItems] as TItem[])
          : [],
      itemsToRetry: []
    };
  }

  const idsOfItemsToRetry = new Set(
    itemsToRetry.map((item) => item[partitionKeyName])
  );
  const successfulItems = currentAttemptItems.filter(
    (item) => !idsOfItemsToRetry.has(item[partitionKeyName])
  ) as TItem[];

  return { successfulItems, itemsToRetry };
}

export interface BatchUpdateResult<TItem = any> {
  totalItems: number;
  successfulItems: TItem[];
  errors: Array<{
    item: TItem;
    error: string;
  }>;
}
