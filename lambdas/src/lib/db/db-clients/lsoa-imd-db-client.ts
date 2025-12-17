import { Service } from '../../service';
import { type DbClient } from '../db-client';
import { type Commons } from '../../commons';
import { DbTable } from '../db-tables';
import { type EntityFetchParams } from '../entity-update-params';
import { type ILsoaImd } from '../../models/deprivation-score/lsoa-imd';

export class LsoaImdDbClient extends Service {
  readonly dbClient: DbClient;

  constructor(commons: Commons, dbClient: DbClient) {
    super(commons, 'LsoaImdDbClient');
    this.dbClient = dbClient;
  }

  public async getLsoaImd(lsoa: string): Promise<ILsoaImd | undefined> {
    this.logger.info('Fetching LsoaImd');

    const fetchParams: EntityFetchParams = {
      table: DbTable.LsoaImd,
      partitionKeyValue: lsoa
    };

    const record =
      await this.dbClient.getOptionalRecordById<ILsoaImd>(fetchParams);

    if (record) {
      this.logger.info('LsoaImd fetched successfully');
    } else {
      this.logger.info('LsoaImd not found in LsoaImd table', {
        lsoa
      });
    }

    return record;
  }
}
