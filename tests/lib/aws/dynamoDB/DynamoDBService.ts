/* eslint-disable max-params */
import {
  type AttributeValue,
  DynamoDB,
  type GetItemCommandInput,
  type GetItemOutput,
  type QueryCommandInput,
  type PutItemCommandInput,
  type DeleteItemInput,
  type ScanCommandInput,
  type ScanCommandOutput
} from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import type { IHealthCheckAnswers } from '@dnhc-health-checks/shared';

export class DynamoDBService {
  client: DynamoDB;
  envName: string;

  constructor(evnName: string) {
    this.client = new DynamoDB({ region: 'eu-west-2' });
    this.envName = evnName;
  }

  public async pause(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async getItemByPartitionKey(
    tableName: string,
    key: string,
    value: string,
    type = 'S'
  ): Promise<GetItemOutput | undefined> {
    const keyParameter: any = {};
    keyParameter[key] = {};
    keyParameter[key][type] = value;

    const params: GetItemCommandInput = {
      TableName: tableName,
      Key: keyParameter,
      ConsistentRead: true
    };
    return (await this.client.getItem(params)).Item;
  }

  public async getItemByPartitionAndSortKey(
    tableName: string,
    key: string,
    value: string,
    sortKey: string,
    sortValue: string,
    type = 'S',
    sortType = 'S'
  ): Promise<GetItemOutput | undefined> {
    const keyParameter: any = {};
    keyParameter[key] = {};
    keyParameter[key][type] = value;
    keyParameter[sortKey] = {};
    keyParameter[sortKey][sortType] = sortValue;

    const params: GetItemCommandInput = {
      TableName: tableName,
      Key: keyParameter,
      ConsistentRead: true
    };
    return (await this.client.getItem(params)).Item;
  }

  public async getJsonItemByPartitionKey(
    tableName: string,
    key: string,
    value: string,
    type = 'S'
  ): Promise<any> {
    const dbItem: any = await this.getItemByPartitionKey(
      tableName,
      key,
      value,
      type
    );
    return unmarshall(dbItem as AttributeValue);
  }

  public async getJsonItemByPartitionAndSortKey(
    tableName: string,
    key: string,
    value: string,
    sortKey: string,
    sortValue: string,
    type = 'S',
    sortType = 'S'
  ): Promise<any> {
    const dbItem: any = await this.getItemByPartitionAndSortKey(
      tableName,
      key,
      value,
      sortKey,
      sortValue,
      type,
      sortType
    );
    return unmarshall(dbItem as AttributeValue);
  }

  public async queryItemsByIndex<TResult>(
    tableName: string,
    indexName: string,
    keyName: string,
    keyValue: string
  ): Promise<TResult[]> {
    console.log('about to fetch records from table', {
      [keyName]: keyValue,
      tableName,
      indexName
    });

    try {
      const command: QueryCommandInput = {
        TableName: tableName,
        KeyConditionExpression: `${keyName} = :partitionKeyValue`,
        ExpressionAttributeValues: {
          ':partitionKeyValue': { S: keyValue }
        },
        IndexName: indexName
      };

      const result = await this.client.query(command);
      console.log('records fetched successfully', {
        numberOfResults: result.Count,
        result
      });
      return result.Items?.map((item) => unmarshall(item)) as TResult[];
    } catch (error) {
      console.error('could not fetch records from table', {
        [keyName]: keyValue,
        tableName,
        indexName
      });
      throw error;
    }
  }

  public async getAllItems<TResult>(tableName: string): Promise<TResult[]> {
    console.log('about to fetch records from table', { tableName });
    try {
      const command: ScanCommandInput = {
        TableName: tableName
      };

      let scanResult: TResult[] = [];
      let items: ScanCommandOutput;
      do {
        items = await this.client.scan({ ...command });
        command.ExclusiveStartKey = items.LastEvaluatedKey;

        if (items.Items) {
          scanResult = scanResult.concat(
            items.Items.map((item) => unmarshall(item)) as TResult[]
          );
        }
      } while (items.LastEvaluatedKey !== undefined);
      console.log('All records fetched successfully', {
        numberOfResults: scanResult.length
      });
      return scanResult;
    } catch (error) {
      console.error('Could not fetch all records from table', {
        tableName,
        error
      });
      throw error;
    }
  }

  public async updateItemByPartitionKey(
    tableName: string,
    keyName: string,
    keyValue: string,
    updatedItemName: string,
    updatedItemValue: string | boolean | IHealthCheckAnswers,
    keyType = 'S',
    updatedItemType = 'S'
  ): Promise<any> {
    return await this.updateItemsByPartitionKey(
      tableName,
      keyName,
      keyValue,
      { [updatedItemName]: updatedItemValue },
      keyType,
      updatedItemType
    );
  }

  public async updateItemsByPartitionKey(
    tableName: string,
    keyName: string,
    keyValue: any,
    updatedItems: Record<string, any>,
    keyType = 'S',
    updatedItemType = 'S'
  ): Promise<any> {
    const keyParameter: any = {};
    keyParameter[keyName] = {};
    keyParameter[keyName][keyType] = keyValue;

    const expressionAttributeValues: any = {};
    let updateExpressionCommand = 'set ';

    Object.entries(updatedItems).forEach(([itemName, itemValue], index) => {
      const placeholder = `:u${index}`;
      updateExpressionCommand += `${itemName} = ${placeholder}, `;
      const updatedItemValueData =
        typeof itemValue === 'object'
          ? marshall(itemValue)
          : itemValue.toString();
      expressionAttributeValues[placeholder] = {};
      expressionAttributeValues[placeholder][updatedItemType] =
        updatedItemValueData;
    });

    // Remove the trailing comma and space
    updateExpressionCommand = updateExpressionCommand.slice(0, -2);

    const params = {
      TableName: tableName,
      Key: keyParameter,
      UpdateExpression: updateExpressionCommand,
      ExpressionAttributeValues: expressionAttributeValues
    };
    return await this.client.updateItem(params);
  }

  public async putItem(tableName: string, item: any): Promise<void> {
    const command: PutItemCommandInput = {
      TableName: tableName,
      Item: marshall(item, { removeUndefinedValues: true })
    };

    try {
      await this.client.putItem(command);
    } catch (error) {
      console.error('could not create a new record in the table', {
        tableName
      });
      throw error;
    }
  }

  public async deleteItemByPartitionKey(
    tableName: string,
    partitionKeyName: string,
    partitionKeyValue: string,
    partitionKeyType = 'S'
  ): Promise<void> {
    const keyParameter: any = {};
    keyParameter[partitionKeyName] = {};
    keyParameter[partitionKeyName][partitionKeyType.toUpperCase()] =
      partitionKeyValue;

    const params: DeleteItemInput = {
      TableName: tableName,
      Key: keyParameter
    };
    console.log(`Delete parameters : ${JSON.stringify(params, null, 2)}`);

    await this.client.deleteItem(params);
  }

  public async deleteItemByPartitionAndSortKey(
    tableName: string,
    partitionKeyName: string,
    partitionKeyValue: string,
    sortKeyName: string,
    sortKeyValue: string,
    partitionKeyType = 'S',
    sortKeyType = 'S'
  ): Promise<void> {
    const keyParameter: any = {};
    keyParameter[partitionKeyName] = {};
    keyParameter[partitionKeyName][partitionKeyType.toUpperCase()] =
      partitionKeyValue;
    keyParameter[sortKeyName] = {};
    keyParameter[sortKeyName][sortKeyType.toUpperCase()] = sortKeyValue;

    const params: DeleteItemInput = {
      TableName: tableName,
      Key: keyParameter
    };
    console.log(`Delete parameters : ${JSON.stringify(params, null, 2)}`);

    await this.client.deleteItem(params);
  }
}
