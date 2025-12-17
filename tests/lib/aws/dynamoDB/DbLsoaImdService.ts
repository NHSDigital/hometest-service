import { DynamoDBService } from './DynamoDBService';

export interface LsoaImdItem {
  lsoaCode: string;
  imdDecile: number;
  imdRank: number;
  imdScore: number;
}

export default class DbLsoaImdService extends DynamoDBService {
  private getTableName(): string {
    return `${this.envName}-nhc-lsoa-imd-db`;
  }

  async getLsoaImdItemByLsoaCode(lsoaCode: string): Promise<LsoaImdItem> {
    return (await this.getJsonItemByPartitionKey(
      this.getTableName(),
      'lsoaCode',
      lsoaCode
    )) as LsoaImdItem;
  }

  async createLsoaImdItem(lsoaImdItem: LsoaImdItem): Promise<void> {
    await this.putItem(this.getTableName(), lsoaImdItem);
    console.log('LsoaImd item created');
  }

  async deleteLsoaImdItemByLsoaCode(lsoaCode: string): Promise<void> {
    await this.deleteItemByPartitionKey(
      this.getTableName(),
      'lsoaCode',
      lsoaCode
    );
    console.log('LsoaImd Item deleted');
  }
}
