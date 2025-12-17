import { Service } from '../../service';
import { type DbClient } from '../db-client';
import { DbTable } from '../db-tables';
import { type EntityFetchParams } from '../entity-update-params';
import { type Commons } from '../../commons';
import { type ITownsendScore } from '../../models/townsend-scores/townsend-score';

export class TownsendScoreDbClient extends Service {
  readonly dbClient: DbClient;
  constructor(commons: Commons, dbClient: DbClient) {
    super(commons, 'TownsendScoreDbClient');
    this.dbClient = dbClient;
  }

  public async getDeprivationScoreByPostcode(
    postcode: string
  ): Promise<string | null> {
    const postcodeToSearch = postcode.replaceAll(/\s+/g, '');

    this.logger.info('About to fetch townsend deprivation score by postcode');
    const fetchParams: EntityFetchParams = {
      table: DbTable.TownsendScores,
      partitionKeyValue: postcodeToSearch
    };
    const townsendScore =
      await this.dbClient.getOptionalRecordById<ITownsendScore>(fetchParams);

    if (!townsendScore) {
      this.logger.info('Postcode could not be found in table', {
        postcode: postcodeToSearch
      });
      return null;
    }

    this.logger.info(
      'Townsend deprivation score has been fetched successfully'
    );

    return townsendScore?.deprivationScore ?? null;
  }
}
