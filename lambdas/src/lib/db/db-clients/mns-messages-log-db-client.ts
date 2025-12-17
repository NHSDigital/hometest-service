import { type DbClient } from '../db-client';
import { DbTable } from '../db-tables';
import {
  type EntityCreateParams,
  type EntityUpdateParams
} from '../entity-update-params';
import { Service } from '../../service';
import { type Commons } from '../../commons';
import type { IMnsMessageLog } from '@dnhc-health-checks/shared';

export class MnsMessagesLogDbClient extends Service {
  readonly dbClient: DbClient;
  constructor(commons: Commons, dbClient: DbClient) {
    super(commons, 'MnsMessagesLogDbClient');
    this.dbClient = dbClient;
  }

  public async insertMnsMessageLog(
    mnsMessageLog: IMnsMessageLog
  ): Promise<void> {
    const createParams: EntityCreateParams = {
      table: DbTable.MnsMessagesLog,
      item: mnsMessageLog
    };
    await this.dbClient.createRecord(createParams);
  }

  public async updateMnsMessageLog(
    id: string,
    mnsMessageLog: Partial<IMnsMessageLog>
  ): Promise<IMnsMessageLog> {
    const updateParams: EntityUpdateParams = {
      table: DbTable.MnsMessagesLog,
      partitionKeyValue: id,
      updates: mnsMessageLog,
      returnValues: 'ALL_NEW'
    };

    return await this.dbClient.updateRecordProperties<IMnsMessageLog>(
      updateParams
    );
  }

  public async getMnsMessageLogById(
    id: string
  ): Promise<IMnsMessageLog | undefined> {
    const params = {
      table: DbTable.MnsMessagesLog,
      partitionKeyValue: id
    };

    return await this.dbClient.getOptionalRecordById<IMnsMessageLog>(params);
  }
}
