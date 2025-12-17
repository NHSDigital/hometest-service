import { DynamoDBService } from './DynamoDBService';
import {
  type AutoExpiryStatus,
  type HealthCheckSteps,
  type IHealthCheck,
  type IHealthCheckAnswers,
  type IRiskScores
} from '@dnhc-health-checks/shared';

/*
  For automated handling of the health check version please use the class DynamoDBServiceUtils to create the health check item.
  The version will be set to either the value set in the defaults file or your env file
*/
export default class DbHealthCheckService extends DynamoDBService {
  private getTableName(): string {
    return `${this.envName}-nhc-health-check-db`;
  }

  async getHealthCheckItemById(healthCheckId: string): Promise<IHealthCheck> {
    const response = (await this.getJsonItemByPartitionKey(
      this.getTableName(),
      'id',
      healthCheckId
    )) as IHealthCheck;
    console.log(
      `HealthCheck db item for ID '${healthCheckId}':\n${JSON.stringify(response, null, 2)} `
    );
    return response;
  }

  async getHealthCheckItemsByNhsNumber(
    nhsNumber: string
  ): Promise<IHealthCheck[]> {
    const response = await this.queryItemsByIndex<IHealthCheck>(
      this.getTableName(),
      'nhsNumberIndex',
      'nhsNumber',
      nhsNumber
    );
    console.log(`HealthCheck db items for nhsNum '${nhsNumber}':`, {
      response
    });
    return response;
  }

  async getIdByNhsNumber(nhsNumber: string): Promise<string> {
    let healthCheckId = '';
    const response = await this.getHealthCheckItemsByNhsNumber(nhsNumber);
    response.forEach((element: IHealthCheck) => {
      healthCheckId = element.id;
    });
    return healthCheckId;
  }

  async getLatestHealthCheckItemsByNhsNumber(
    nhsNumber: string
  ): Promise<IHealthCheck | undefined> {
    const response = (
      await this.getHealthCheckItemsByNhsNumber(nhsNumber)
    ).reduce(function (prev, current) {
      return prev.createdAt > current.createdAt ? prev : current;
    });
    console.log(`HealthCheck db items for nhsNum '${nhsNumber}':`, {
      response
    });
    return response;
  }

  async waitForKeyToBePresentByHealthCheckId(
    healthCheckId: string,
    key: keyof IHealthCheck,
    maxAttempts: number = 10,
    delayMs: number = 3000
  ): Promise<IHealthCheck> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const healthCheck = await this.getHealthCheckItemById(healthCheckId);
      if (healthCheck[key] !== undefined) {
        return healthCheck;
      }

      attempts++;
      if (attempts < maxAttempts) {
        await this.pause(delayMs);
      }
    }

    throw new Error(`Health check with id ${healthCheckId} has no risk scores`);
  }

  async waitForRiskScoresToBeUpdatedByNhsNumber(
    nhsNumber: string,
    expectedRiskScores: IRiskScores,
    expectedAgeAtCompletion: number,
    maxAttempts: number = 10,
    delayMs: number = 3000
  ): Promise<boolean> {
    let attempts = 0;
    let result = false;

    while (attempts < maxAttempts) {
      const response =
        await this.getLatestHealthCheckItemsByNhsNumber(nhsNumber);
      console.log(
        `List of Health check riskScores for nhsNumber '${nhsNumber}': ${JSON.stringify(response?.riskScores, null, 2)}`
      );

      console.log(
        `AgeAtCompletion for nhsNumber '${nhsNumber}': ${JSON.stringify(response?.ageAtCompletion, null, 2)}`
      );

      if (
        response?.riskScores?.heartAge === expectedRiskScores.heartAge &&
        response?.riskScores?.qRiskScore === expectedRiskScores.qRiskScore &&
        response?.riskScores.qRiskScoreCategory ===
          expectedRiskScores.qRiskScoreCategory &&
        response?.ageAtCompletion === expectedAgeAtCompletion
      ) {
        result = true;
      }

      if (result) return true;

      attempts++;
      if (attempts < maxAttempts) {
        await this.pause(delayMs);
      }
    }

    console.log(
      'Max attempts reached: No match found for expected risk scores'
    );
    return false;
  }

  async waitForExpiryStatusUpdate(
    healthCheckId: string,
    expectedStatus: AutoExpiryStatus,
    maxAttempts: number = 5,
    delayMs: number = 2000
  ): Promise<IHealthCheck | undefined> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await this.getHealthCheckItemById(healthCheckId);

      if (response?.expiryStatus === expectedStatus) {
        return response;
      }

      attempts++;
      if (attempts < maxAttempts) {
        await this.pause(delayMs);
      }
    }

    console.log(
      'Max attempts reached: No match found for expected risk scores'
    );
    return undefined;
  }

  async waitForHealthCheckStepStatusToBeUpdatedByHealthCheckId(
    healthCheckId: string,
    expectedStepStatus: HealthCheckSteps,
    maxAttempts: number = 10,
    delayMs: number = 3000
  ): Promise<boolean> {
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      const response = await this.getHealthCheckItemById(healthCheckId);

      console.log(`HealthCheckId: ${healthCheckId}, Step: ${response.step}`);

      if (response?.step === expectedStepStatus) {
        return true;
      }

      if (attempts < maxAttempts) {
        await this.pause(delayMs);
      }
    }

    console.log(
      'Max attempts reached: No match found for expected step status'
    );
    return false;
  }

  async createHealthCheck(healthCheck: IHealthCheck): Promise<void> {
    await this.putItem(this.getTableName(), healthCheck);
    console.log(`HealthCheck db item created: ${healthCheck.id}`);
  }

  async deleteItemByNhsNumber(nhsNumber: string): Promise<void> {
    const nhsNumberItems = await this.getHealthCheckItemsByNhsNumber(nhsNumber);
    await Promise.all(
      nhsNumberItems.map(async (element: IHealthCheck) => {
        await this.deleteItemByPartitionKey(
          this.getTableName(),
          'id',
          element.id
        );
      })
    );
  }

  async deleteEmptyHealthCheckItems(): Promise<void> {
    const healthChecksList: IHealthCheck[] = await this.getAllItems(
      this.getTableName()
    );
    await Promise.all(
      healthChecksList
        .filter(
          (healthCheckItem: IHealthCheck) =>
            healthCheckItem.nhsNumber === undefined
        )
        .map(async (healthCheckItem: IHealthCheck) => {
          await this.deleteItemById(healthCheckItem.id);
        })
    );
  }

  async deleteItemById(id: string): Promise<void> {
    await this.deleteItemByPartitionKey(this.getTableName(), 'id', id);
  }

  async updateHealthCheckQuestionnaire(
    id: string,
    questionnaire: IHealthCheckAnswers
  ): Promise<void> {
    const response = (await this.updateItemByPartitionKey(
      this.getTableName(),
      'id',
      id,
      'questionnaire',
      questionnaire,
      'S',
      'M'
    )) as void;
    console.log(`Updated value for ID '${id}'`, { response });
  }

  async updateHealthCheckStep(id: string, step: string): Promise<void> {
    const response = (await this.updateItemByPartitionKey(
      this.getTableName(),
      'id',
      id,
      'step',
      step
    )) as void;
    console.log(`Updated value for ID '${id}'`, { response });
  }

  async updateHealthCheckItem(
    id: string,
    itemName: keyof IHealthCheck,
    itemValue: string
  ): Promise<void> {
    const response = (await this.updateItemByPartitionKey(
      this.getTableName(),
      'id',
      id,
      itemName,
      itemValue
    )) as void;
    console.log(`Updated value for ID '${id}'`, { response });
  }

  async removeItemsFromQuestionnaire(
    nhsNumber: string,
    listOfItemsToDelete: Array<keyof IHealthCheckAnswers>
  ): Promise<void> {
    const healthCheckId = await this.getIdByNhsNumber(nhsNumber);
    const data = await this.getHealthCheckItemById(healthCheckId);
    const questionnaire = data.questionnaire ?? {};
    listOfItemsToDelete.forEach((element) => {
      delete questionnaire[element];
    });

    await this.updateHealthCheckQuestionnaire(healthCheckId, questionnaire);
  }
}
