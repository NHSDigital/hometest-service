import { DynamoDBService } from './DynamoDBService';

export interface TownsendScoreItem {
  postcode: string;
  deprivationScore: string;
}

export default class DbTownsendScoreService extends DynamoDBService {
  private readonly townsendTableName: string;
  constructor(envName: string, townsendTableName?: string) {
    super(envName);
    this.townsendTableName =
      townsendTableName ?? this.envName + '-nhc-townsend-dev-db';
  }

  private getTableName(): string {
    return this.townsendTableName;
  }

  async getTownsendScoreItemByPostcode(
    postcode: string
  ): Promise<TownsendScoreItem> {
    return (await this.getJsonItemByPartitionKey(
      this.getTableName(),
      'postcode',
      postcode
    )) as TownsendScoreItem;
  }

  async createTownsendScoreItem(
    townsendScoreItem: TownsendScoreItem
  ): Promise<void> {
    await this.putItem(this.getTableName(), townsendScoreItem);
    console.log('TownsendScoreItem created');
  }

  async deleteTownsendScoreByPostcode(postcode: string): Promise<void> {
    await this.deleteItemByPartitionKey(
      this.getTableName(),
      'postcode',
      postcode
    );
    console.log('TownsendScoreItem deleted');
  }
}
