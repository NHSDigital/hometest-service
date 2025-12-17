import {
  type DynamoDBDocument,
  type ScanCommandInput
} from '@aws-sdk/lib-dynamodb';
import { type IAction } from '../../../src/types';
import { HealthCheckMigrationBase } from '../../../src/migrations/health-check-migration-base';

export class V1HealthCheckMigration
  extends HealthCheckMigrationBase
  implements IAction
{
  private static readonly actionName: string =
    'DNHC-3202-V1HealthCheckMigration';

  private envName: string;
  private tableName: string;

  constructor(client: DynamoDBDocument) {
    super(client, V1HealthCheckMigration.actionName);
  }

  async run(envName: string, dryRun: boolean): Promise<void> {
    this.envName = envName;
    this.tableName = `${this.envName}-nhc-health-check-db`;
    await this.runMigration(this.tableName, dryRun);
  }

  getScanCommandInput(): ScanCommandInput {
    return {
      TableName: this.tableName,
      FilterExpression: '#version = :versionValue',
      ExpressionAttributeNames: { '#version': 'version' },
      ExpressionAttributeValues: { ':versionValue': '1.0.0' }
    };
  }

  async migrateItem(item: any): Promise<void> {
    const biometricScoresUpdate = this.prepareBiometricScoresUpdate(item);
    const dataModelVersionHistoryUpdate =
      this.prepareDataModelVersionHistoryUpdate(item);

    // Build update expression and values
    let UpdateExpression = 'REMOVE #version SET #dmv = :dmv, #dmvh = :dmvh';
    const ExpressionAttributeNames: Record<string, string> = {
      '#dmv': 'dataModelVersion',
      '#dmvh': 'dataModelVersionHistory',
      '#version': 'version'
    };
    const ExpressionAttributeValues: Record<string, any> = {
      ':dmv': '1.1.0',
      ':dmvh': dataModelVersionHistoryUpdate
    };

    if (biometricScoresUpdate !== undefined) {
      UpdateExpression += ', #bs = :bs';
      ExpressionAttributeNames['#bs'] = 'biometricScores';
      ExpressionAttributeValues[':bs'] = biometricScoresUpdate;
    }

    await this.client.update({
      TableName: this.tableName,
      Key: { id: item.id },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues
    });
  }

  private prepareBiometricScoresUpdate(item: any): any {
    const previousBiometricScores = item.biometricScores;
    if (previousBiometricScores !== undefined) {
      const newBiometricScores = [
        {
          date: '',
          scores: {
            cholesterol: previousBiometricScores.cholesterol,
            diabetes: {
              overallCategory: previousBiometricScores.diabetes?.category,
              ...previousBiometricScores.diabetes
            }
          }
        }
      ];
      return newBiometricScores;
    }
    return undefined;
  }

  private prepareDataModelVersionHistoryUpdate(item: any): any {
    const dataModelVersionHistory = [
      {
        dataModelVersion: '1.0.0',
        migrationDate: item.createdAt
      },
      {
        dataModelVersion: '1.1.0',
        migrationDate: new Date().toISOString()
      }
    ];
    return dataModelVersionHistory;
  }

  getActionName(): string {
    return V1HealthCheckMigration.actionName;
  }

  async cleanUp(): Promise<void> {
    super.cleanUp();
  }
}
