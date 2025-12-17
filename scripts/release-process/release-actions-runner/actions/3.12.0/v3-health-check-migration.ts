import { HealthCheckMigrationBase } from '../../src/migrations/health-check-migration-base';
import {
  type DynamoDBDocument,
  type ScanCommandInput
} from '@aws-sdk/lib-dynamodb';
import { type IAction } from '../../src/types';

export class V3HealthCheckMigration
  extends HealthCheckMigrationBase
  implements IAction
{
  private static readonly actionName = 'DNHC-3839-V3HealthCheckMigration';
  private envName: string;
  private tableName: string;

  constructor(client: DynamoDBDocument) {
    super(client, V3HealthCheckMigration.actionName);
  }

  async run(envName: string, dryRun: boolean): Promise<void> {
    this.envName = envName;
    this.tableName = `${this.envName}-nhc-health-check-db`;
    await this.runMigration(this.tableName, dryRun);
  }

  getScanCommandInput(): ScanCommandInput {
    return {
      TableName: this.tableName,
      FilterExpression:
        '#dataModelVersion = :dataModelVersionValue AND attribute_exists(#q) AND #step = :stepValue',
      ExpressionAttributeNames: {
        '#dataModelVersion': 'dataModelVersion',
        '#q': 'questionnaire',
        '#step': 'step'
      },
      ExpressionAttributeValues: {
        ':dataModelVersionValue': '2.1.0',
        ':stepValue': 'INIT'
      }
    };
  }
  private isEmptyQuestionnaire(q: unknown): q is Record<string, unknown> {
    return (
      !!q &&
      typeof q === 'object' &&
      !Array.isArray(q) &&
      Object.keys(q as Record<string, unknown>).length === 0
    );
  }

  async migrateItem(item: any): Promise<void> {
    // Only proceed if questionnaire exists and is an empty map {}
    if (!this.isEmptyQuestionnaire(item.questionnaire)) {
      return;
    }

    const dataModelVersionHistoryUpdate =
      this.prepareDataModelVersionHistoryUpdate(item);

    // Build update expression and values
    let UpdateExpression = 'SET #dmv = :dmv, #dmvh = :dmvh';
    const ExpressionAttributeNames: Record<string, string> = {
      '#dmv': 'dataModelVersion',
      '#dmvh': 'dataModelVersionHistory'
    };
    const ExpressionAttributeValues: Record<string, any> = {
      ':dmv': '3.0.0',
      ':dmvh': dataModelVersionHistoryUpdate
    };

    await this.client.update({
      TableName: this.tableName,
      Key: { id: item.id },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues
    });
  }

  private prepareDataModelVersionHistoryUpdate(item: any): any {
    const versionHistory = item.dataModelVersionHistory ?? [
      {
        dataModelVersion: '2.1.0',
        migrationDate: item.createdAt
      }
    ];
    versionHistory.push({
      dataModelVersion: '3.0.0',
      migrationDate: new Date().toISOString()
    });
    return versionHistory;
  }

  getActionName(): string {
    return V3HealthCheckMigration.actionName;
  }

  async cleanUp(): Promise<void> {
    super.cleanUp();
  }
}
