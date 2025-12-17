import { type OdsItem } from '../../../testData/odsCodeData';
import { DynamoDBService } from './DynamoDBService';
import { validate } from 'uuid';

export default class DbOdsCodeService extends DynamoDBService {
  private getTableName(): string {
    return `${this.envName}-nhc-ods-code-db`;
  }

  async getGpOdsItemByOdsCOde(odsCode: string): Promise<OdsItem> {
    return (await this.getJsonItemByPartitionKey(
      this.getTableName(),
      'gpOdsCode',
      odsCode
    )) as OdsItem;
  }

  async createGpOdsCodeItem(odsCodeItem: OdsItem): Promise<void> {
    await this.putItem(this.getTableName(), odsCodeItem);
    console.log('GpOdsCode db item created');
  }

  async updateGpOdsCodeAvailability(
    gpOdsCode: string,
    gpOdsCodeAvailability: boolean
  ): Promise<void> {
    const response = await this.updateItemByPartitionKey(
      this.getTableName(),
      'gpOdsCode',
      gpOdsCode,
      'enabled',
      gpOdsCodeAvailability,
      'S',
      'BOOL'
    );
    console.log(`Updated value for Ods Code '${gpOdsCode}'`, { response });
  }

  async updateNameAndEmail(gpOdsCode: string, name: string, email: string) {
    const response = await this.updateItemsByPartitionKey(
      this.getTableName(),
      'gpOdsCode',
      gpOdsCode,
      {
        gpName: name,
        gpEmail: email
      }
    );
    console.log(`Updated name and email value for Ods Code '${gpOdsCode}'`, {
      response
    });
  }

  async deleteGpOdsCodeItem(odsCode: string): Promise<void> {
    await this.deleteItemByPartitionKey(
      this.getTableName(),
      'gpOdsCode',
      odsCode
    );
  }

  async cleanUpOdsCodeItems(): Promise<void> {
    const odsCodeItemsList: OdsItem[] = await this.getAllItems(
      this.getTableName()
    );
    await Promise.all(
      odsCodeItemsList
        .filter((odsCodeItem: OdsItem) => validate(odsCodeItem.gpOdsCode))
        .map(async (odsCodeItem: OdsItem) => {
          console.log(`Deleting Ods Code Item: ${odsCodeItem.gpOdsCode}`);
          await this.deleteGpOdsCodeItem(odsCodeItem.gpOdsCode);
        })
    );
  }
}
