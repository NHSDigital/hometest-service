import { type GlueClient, GetTableCommand } from '@aws-sdk/client-glue';
import { AWSService } from '../aws-service';
import type { Commons } from '../commons';

export class GlueClientService extends AWSService<GlueClient> {
  constructor(commons: Commons, glueClient: GlueClient) {
    super(commons, 'GlueClientService', glueClient);
  }

  async getTable(databaseName: string, tableName: string) {
    try {
      this.logger.info('about to get table', { databaseName, tableName });
      const command = new GetTableCommand({
        DatabaseName: databaseName,
        Name: tableName
      });
      const response = await this.client.send(command);
      return response.Table;
    } catch (error) {
      this.logger.error('error occurred while getting table', { error });
      throw error;
    }
  }
}
