import { type Logger } from 'winston';
import { DynamoDbMigrationBase } from './dynamodb-migration-base';
import logger from '../logger';

export abstract class HealthCheckMigrationBase extends DynamoDbMigrationBase {
  protected logDataToCsv(csvLogger: Logger, item: any): void {
    csvLogger.log('csv', `${item.id}|${item.step}`);
  }

  abstract migrateItem(item: any): Promise<void>;

  async processSingleItem(item: any, dryRun: boolean): Promise<void> {
    if (dryRun) {
      this.logDataToCsv(this.csvSuccessLogger, item);
      return;
    }
    try {
      await this.migrateItem(item);
      this.logDataToCsv(this.csvSuccessLogger, item);
    } catch {
      logger.info(
        `An Error occurred when migrating health check with id ${item.id}`
      );
      this.logDataToCsv(this.csvFailureLogger, item);
    }
  }
}
