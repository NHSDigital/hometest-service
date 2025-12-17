import { Service } from '../../service';
import { type DbClient } from '../db-client';
import { type Commons } from '../../commons';
import { DbTable } from '../db-tables';
import { type EntityFetchParams } from '../entity-update-params';
import { type IPostcodeLsoa } from '../../models/deprivation-score/postcode-lsoa';

export class PostcodeLsoaDbClient extends Service {
  readonly dbClient: DbClient;

  constructor(commons: Commons, dbClient: DbClient) {
    super(commons, 'PostcodeLsoaDbClient');
    this.dbClient = dbClient;
  }

  public async getPostcodeLsoa(
    postcode: string
  ): Promise<IPostcodeLsoa | undefined> {
    const postcodeToSearch = postcode.replaceAll(/\s+/g, '');
    this.logger.info('Fetching PostcodeLsoa');

    const fetchParams: EntityFetchParams = {
      table: DbTable.PostcodeLsoa,
      partitionKeyValue: postcodeToSearch
    };

    const record =
      await this.dbClient.getOptionalRecordById<IPostcodeLsoa>(fetchParams);

    if (record) {
      this.logger.info('PostcodeLsoa fetched successfully');
    } else {
      this.logger.info('Postcode not found in PostcodeLsoa table', {
        postcode: postcodeToSearch
      });
    }

    return record;
  }
}
