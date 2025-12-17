import { type DbClient } from '../db-client';
import { DbTable } from '../db-tables';
import {
  type EntityCreateParams,
  type EntityUpdateParams
} from '../entity-update-params';
import { Service } from '../../service';
import { type Commons } from '../../commons';
import { type ICommunicationLog } from '../../models/notify-callbacks/communication-log';

export class CommunicationLogDbClient extends Service {
  readonly dbClient: DbClient;
  constructor(commons: Commons, dbClient: DbClient) {
    super(commons, 'CommunicationLogDbClient');
    this.dbClient = dbClient;
  }

  public async insertCommunicationLog(
    communicationLog: ICommunicationLog
  ): Promise<void> {
    const createParams: EntityCreateParams = {
      table: DbTable.CommunicationLog,
      item: communicationLog
    };
    await this.dbClient.createRecord(createParams);
  }

  public async updateCommunicationLog(
    messageReference: string,
    communicationLog: Partial<ICommunicationLog>
  ): Promise<ICommunicationLog> {
    const updateParams: EntityUpdateParams = {
      table: DbTable.CommunicationLog,
      partitionKeyValue: messageReference,
      updates: {
        ...communicationLog
      },
      returnValues: 'ALL_NEW'
    };

    return await this.dbClient.updateRecordProperties<ICommunicationLog>(
      updateParams
    );
  }

  public async getCommunicationLogByMessageReference(
    messageReference: string
  ): Promise<ICommunicationLog | undefined> {
    const params = {
      table: DbTable.CommunicationLog,
      partitionKeyValue: messageReference
    };

    return await this.dbClient.getOptionalRecordById<ICommunicationLog>(params);
  }
}
