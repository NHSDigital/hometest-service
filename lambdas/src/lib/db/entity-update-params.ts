import { type ReturnValue } from '@aws-sdk/client-dynamodb';
import { type DbTable } from './db-tables';

export interface EntityUpdateParams {
  table: DbTable;
  partitionKeyValue: string;
  sortKeyValue?: string;
  updates: Record<string, unknown>;
  returnValues?: ReturnValue;
  removals?: string[];
}

export interface EntityFetchParams {
  table: DbTable;
  partitionKeyValue: string;
  partitionKeyName?: string;
  sortKeyValue?: string;
  sortKeyName?: string;
  indexName?: string;
}

export interface EntityCreateParams {
  table: DbTable;
  item: any;
  conditionExpression?: string;
}

export interface EntityDeleteParams {
  table: DbTable;
  partitionKeyValue: string;
  sortKeyValue?: string;
}

export interface EntityScanParams {
  table: DbTable;
  filterBy?: {
    key: string;
    value: any;
  };
}
