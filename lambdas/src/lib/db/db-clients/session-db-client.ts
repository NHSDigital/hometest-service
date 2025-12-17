import { type Commons } from '../../commons';
import { type ISession } from '../../models/session/session';
import { Service } from '../../service';
import { type DbClient } from '../db-client';
import { DbTable } from '../db-tables';
import {
  type EntityFetchParams,
  type EntityCreateParams,
  type EntityUpdateParams
} from '../entity-update-params';

export class SessionDbClient extends Service {
  readonly dbClient: DbClient;

  constructor(commons: Commons, dbClient: DbClient) {
    super(commons, 'SessionDbClient');
    this.dbClient = dbClient;
  }

  public async createNewSession(session: ISession): Promise<void> {
    const createParams: EntityCreateParams = {
      table: DbTable.Sessions,
      item: session
    };
    await this.dbClient.createRecord(createParams);
  }

  public async getSession(sessionId: string): Promise<ISession | undefined> {
    const fetchParams: EntityFetchParams = {
      table: DbTable.Sessions,
      partitionKeyValue: sessionId
    };

    return await this.dbClient.getOptionalRecordById<ISession>(fetchParams);
  }

  public async deleteSession(sessionId: string): Promise<void> {
    const deleteParams: EntityFetchParams = {
      table: DbTable.Sessions,
      partitionKeyValue: sessionId
    };

    await this.dbClient.deleteRecord(deleteParams);
  }

  public async updateSession(
    sessionId: string,
    session: Partial<ISession>
  ): Promise<void> {
    const updateParams: EntityUpdateParams = {
      table: DbTable.Sessions,
      partitionKeyValue: sessionId,
      updates: {
        ...session
      }
    };

    await this.dbClient.updateRecordProperties(updateParams);
  }
}
