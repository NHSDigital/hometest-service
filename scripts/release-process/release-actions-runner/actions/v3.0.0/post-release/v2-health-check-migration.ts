import {
  type DynamoDBDocument,
  type ScanCommandInput
} from '@aws-sdk/lib-dynamodb';
import { HealthCheckMigrationBase } from '../../../src/migrations/health-check-migration-base';
import { type IAction } from '../../../src/types';

export class V2HealthCheckMigration
  extends HealthCheckMigrationBase
  implements IAction
{
  private static readonly actionName = 'DNHC-3152-V2HealthCheckMigration';
  private envName: string;
  private tableName: string;

  constructor(client: DynamoDBDocument) {
    super(client, V2HealthCheckMigration.actionName);
  }

  async run(envName: string, dryRun: boolean): Promise<void> {
    this.envName = envName;
    this.tableName = `${this.envName}-nhc-health-check-db`;
    await this.runMigration(this.tableName, dryRun);
  }

  getScanCommandInput(): ScanCommandInput {
    return {
      TableName: this.tableName,
      FilterExpression: '#dataModelVersion = :dataModelVersionValue',
      ExpressionAttributeNames: {
        '#dataModelVersion': 'dataModelVersion'
      },
      ExpressionAttributeValues: {
        ':dataModelVersionValue': '2.0.0'
      }
    };
  }

  async migrateItem(item: any): Promise<void> {
    const biometricScoresUpdate = this.prepareBiometricScoresUpdate(item);
    const dataModelVersionHistoryUpdate =
      this.prepareDataModelVersionHistoryUpdate(item);

    // Build update expression and values
    let UpdateExpression = 'SET #dmv = :dmv, #dmvh = :dmvh';
    const ExpressionAttributeNames: Record<string, string> = {
      '#dmv': 'dataModelVersion',
      '#dmvh': 'dataModelVersionHistory'
    };
    const ExpressionAttributeValues: Record<string, any> = {
      ':dmv': '2.1.0',
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
        dataModelVersion: '2.0.0',
        migrationDate: item.createdAt
      },
      {
        dataModelVersion: '2.1.0',
        migrationDate: new Date().toISOString()
      }
    ];
    return dataModelVersionHistory;
  }

  getActionName(): string {
    return V2HealthCheckMigration.actionName;
  }

  async cleanUp(): Promise<void> {
    super.cleanUp();
  }
}
