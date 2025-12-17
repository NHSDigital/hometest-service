import { DynamoDBService } from './DynamoDBService';

export interface PostcodeLsoaItem {
  postcode: string;
  lsoaCode: string;
}

export default class DbPostcodeLsoaService extends DynamoDBService {
  private getTableName(): string {
    return `${this.envName}-nhc-postcode-lsoa-db`;
  }

  async getPostcodeLsoaItemByPostcode(
    postcode: string
  ): Promise<PostcodeLsoaItem> {
    return (await this.getJsonItemByPartitionKey(
      this.getTableName(),
      'postcode',
      postcode
    )) as PostcodeLsoaItem;
  }

  async createPostcodeLsoaItem(
    postcodeLsoaItem: PostcodeLsoaItem
  ): Promise<void> {
    await this.putItem(this.getTableName(), postcodeLsoaItem);
    console.log('Postcode Lsoa created');
  }

  async deletePostcodeLsoaItemByPostcode(postcode: string): Promise<void> {
    await this.deleteItemByPartitionKey(
      this.getTableName(),
      'postcode',
      postcode
    );
    console.log('PostcodeLsoa Item deleted');
  }
}
