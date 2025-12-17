import { type IDbClient } from '../db-client';
import { DbTable } from '../db-tables';
import { Service } from '../../service';
import { type Commons } from '../../commons';
import { type EntityFetchParams } from '../entity-update-params';
import { type ISnomedCode } from '../../models/snomed/snomed-code';

export interface ISnomedCodesDbClient {
  getSnomedCode: (id: string) => Promise<ISnomedCode>;
  getSnomedCodes: () => Promise<ISnomedCode[]>;
}

export class SnomedCodesDbClient
  extends Service
  implements ISnomedCodesDbClient
{
  readonly dbClient: IDbClient;
  constructor(commons: Commons, dbClient: IDbClient) {
    super(commons, 'SnomedCodesDbClient');
    this.dbClient = dbClient;
  }

  public async getSnomedCode(id: string): Promise<ISnomedCode> {
    const fetchParams: EntityFetchParams = {
      table: DbTable.Snomed,
      partitionKeyValue: id
    };

    return await this.dbClient.getRecordById<ISnomedCode>(fetchParams);
  }

  public async getSnomedCodes(): Promise<ISnomedCode[]> {
    return await this.dbClient.getAllRecords<ISnomedCode>({
      table: DbTable.Snomed
    });
  }
}
