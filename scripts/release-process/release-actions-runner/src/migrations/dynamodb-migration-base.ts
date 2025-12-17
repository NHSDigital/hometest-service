import {
  type ScanCommandInput,
  type ScanCommandOutput
} from '@aws-sdk/client-dynamodb';
import logger, { createCsvLogger, removeEmptyLoggerFiles } from '../logger';
import { type DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { type Logger } from 'winston';

export abstract class DynamoDbMigrationBase {
  protected client: DynamoDBDocument;
  protected readonly csvSuccessLogger: Logger;
  private readonly csvSuccessLoggerFileName: string;
  protected readonly csvFailureLogger: Logger;
  private readonly csvFailureLoggerFileName: string;

  abstract getScanCommandInput(): ScanCommandInput;
  abstract processSingleItem(item: any, dryRun: boolean): Promise<void>;

  constructor(client: DynamoDBDocument, actionName: string) {
    this.client = client;
    this.csvFailureLoggerFileName = `${actionName}-failure.csv`;
    this.csvSuccessLoggerFileName = `${actionName}-success.csv`;
    this.csvSuccessLogger = createCsvLogger(this.csvSuccessLoggerFileName);
    this.csvFailureLogger = createCsvLogger(this.csvFailureLoggerFileName);
  }

  protected async runMigration(
    tableName: string,
    dryRun: boolean
  ): Promise<void> {
    logger.info(`Starting data migration on table ${tableName}`);
    try {
      let lastEvaluatedKey: Record<string, any> | undefined;
      let totalScanned = 0;
      let totalMatched = 0;
      do {
        const scanInput = this.getScanCommandInput();
        if (lastEvaluatedKey) {
          scanInput.ExclusiveStartKey = lastEvaluatedKey;
        }
        const result = await this.client.scan(scanInput);
        totalScanned += result.ScannedCount ?? 0;
        totalMatched += result.Count ?? 0;
        logger.info(
          `Scanned ${result.ScannedCount} items from table ${tableName} and found ${result.Count} items matching the migration filter.`
        );
        await this.processFilteredItems(result, dryRun);
        lastEvaluatedKey = result.LastEvaluatedKey;
      } while (lastEvaluatedKey);
      logger.info(
        `Successfully completed data migration on table ${tableName}. Total scanned: ${totalScanned}, total processed: ${totalMatched}`
      );
    } catch (err) {
      logger.error(
        `Error occurred during data migration on table ${tableName}`,
        err
      );
    }
  }

  cleanUp(): void {
    removeEmptyLoggerFiles([
      this.csvSuccessLoggerFileName,
      this.csvFailureLoggerFileName
    ]);
  }

  private async processFilteredItems(
    result: ScanCommandOutput,
    dryRun: boolean
  ): Promise<void> {
    if (!result.Items) {
      return;
    }
    for (const item of result.Items) {
      await this.processSingleItem(item, dryRun);
    }
  }
}
